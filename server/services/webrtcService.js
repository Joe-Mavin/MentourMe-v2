const EventEmitter = require("events");

class WebRTCService extends EventEmitter {
  constructor(socketService) {
    super();
    this.socketService = socketService;
    this.activeCalls = new Map(); // callId -> callData
    this.userCalls = new Map(); // userId -> Set of callIds
  }

  // Initiate a call between users
  initiateCall(callData) {
    const { callId, callerId, receiverId, callType = "video", roomId } = callData;

    // Store call data
    this.activeCalls.set(callId, {
      ...callData,
      status: "initiating",
      startTime: new Date(),
      participants: roomId ? [] : [callerId, receiverId]
    });

    // Track user calls
    if (!this.userCalls.has(callerId)) {
      this.userCalls.set(callerId, new Set());
    }
    this.userCalls.get(callerId).add(callId);

    if (receiverId) {
      if (!this.userCalls.has(receiverId)) {
        this.userCalls.set(receiverId, new Set());
      }
      this.userCalls.get(receiverId).add(callId);
    }

    // Set timeout for unanswered calls
    setTimeout(() => {
      if (this.activeCalls.has(callId)) {
        const call = this.activeCalls.get(callId);
        if (call.status === "initiating") {
          this.endCall(callId, "timeout");
        }
      }
    }, 30000); // 30 seconds timeout

    this.emit("call_initiated", callData);
  }

  // Answer a call
  answerCall(callId, userId, accept = true) {
    const call = this.activeCalls.get(callId);
    if (!call) {
      throw new Error("Call not found");
    }

    if (accept) {
      call.status = "connected";
      call.connectedTime = new Date();
      
      // Add user to participants if it's a room call
      if (call.roomId && !call.participants.includes(userId)) {
        call.participants.push(userId);
      }

      this.emit("call_answered", { callId, userId, accepted: true });
    } else {
      this.endCall(callId, "declined");
      this.emit("call_answered", { callId, userId, accepted: false });
    }
  }

  // End a call
  endCall(callId, reason = "ended") {
    const call = this.activeCalls.get(callId);
    if (!call) {
      return;
    }

    call.status = "ended";
    call.endTime = new Date();
    call.endReason = reason;

    // Calculate call duration
    if (call.connectedTime) {
      call.duration = Math.floor((call.endTime - call.connectedTime) / 1000);
    }

    // Remove from user calls tracking
    call.participants.forEach(userId => {
      if (this.userCalls.has(userId)) {
        this.userCalls.get(userId).delete(callId);
        if (this.userCalls.get(userId).size === 0) {
          this.userCalls.delete(userId);
        }
      }
    });

    // Store call history (you might want to save this to database)
    this.emit("call_ended", { callId, call, reason });

    // Clean up after some time
    setTimeout(() => {
      this.activeCalls.delete(callId);
    }, 60000); // Clean up after 1 minute
  }

  // Join an ongoing room call
  joinRoomCall(callId, userId) {
    const call = this.activeCalls.get(callId);
    if (!call || !call.roomId) {
      throw new Error("Room call not found");
    }

    if (!call.participants.includes(userId)) {
      call.participants.push(userId);
      
      if (!this.userCalls.has(userId)) {
        this.userCalls.set(userId, new Set());
      }
      this.userCalls.get(userId).add(callId);

      this.emit("user_joined_call", { callId, userId });
    }
  }

  // Leave a room call
  leaveRoomCall(callId, userId) {
    const call = this.activeCalls.get(callId);
    if (!call) {
      return;
    }

    const participantIndex = call.participants.indexOf(userId);
    if (participantIndex > -1) {
      call.participants.splice(participantIndex, 1);
    }

    if (this.userCalls.has(userId)) {
      this.userCalls.get(userId).delete(callId);
      if (this.userCalls.get(userId).size === 0) {
        this.userCalls.delete(userId);
      }
    }

    this.emit("user_left_call", { callId, userId });

    // End call if no participants left
    if (call.participants.length === 0) {
      this.endCall(callId, "no_participants");
    }
  }

  // Get call information
  getCall(callId) {
    return this.activeCalls.get(callId);
  }

  // Get user's active calls
  getUserCalls(userId) {
    const callIds = this.userCalls.get(userId) || new Set();
    return Array.from(callIds).map(callId => this.activeCalls.get(callId)).filter(Boolean);
  }

  // Check if user is in a call
  isUserInCall(userId) {
    return this.userCalls.has(userId) && this.userCalls.get(userId).size > 0;
  }

  // Get all active calls
  getActiveCalls() {
    return Array.from(this.activeCalls.values()).filter(call => call.status !== "ended");
  }

  // Handle WebRTC signaling
  handleSignaling(fromUserId, toUserId, signalData) {
    const { type, data, callId } = signalData;

    // Validate that both users are part of the call
    const call = this.activeCalls.get(callId);
    if (!call || !call.participants.includes(fromUserId) || !call.participants.includes(toUserId)) {
      throw new Error("Users not part of this call");
    }

    // Forward the signaling data
    this.socketService.sendToUser(toUserId, "webrtc_signal", {
      from: fromUserId,
      type,
      data,
      callId
    });

    this.emit("signaling_relayed", { fromUserId, toUserId, type, callId });
  }

  // Mute/unmute audio
  toggleAudio(callId, userId, muted) {
    const call = this.activeCalls.get(callId);
    if (!call || !call.participants.includes(userId)) {
      return;
    }

    if (!call.audioStates) {
      call.audioStates = new Map();
    }
    call.audioStates.set(userId, !muted);

    // Notify other participants
    call.participants.forEach(participantId => {
      if (participantId !== userId) {
        this.socketService.sendToUser(participantId, "participant_audio_toggled", {
          callId,
          userId,
          muted
        });
      }
    });

    this.emit("audio_toggled", { callId, userId, muted });
  }

  // Turn video on/off
  toggleVideo(callId, userId, enabled) {
    const call = this.activeCalls.get(callId);
    if (!call || !call.participants.includes(userId)) {
      return;
    }

    if (!call.videoStates) {
      call.videoStates = new Map();
    }
    call.videoStates.set(userId, enabled);

    // Notify other participants
    call.participants.forEach(participantId => {
      if (participantId !== userId) {
        this.socketService.sendToUser(participantId, "participant_video_toggled", {
          callId,
          userId,
          enabled
        });
      }
    });

    this.emit("video_toggled", { callId, userId, enabled });
  }

  // Share screen
  shareScreen(callId, userId, sharing) {
    const call = this.activeCalls.get(callId);
    if (!call || !call.participants.includes(userId)) {
      return;
    }

    call.screenSharing = sharing ? userId : null;

    // Notify other participants
    call.participants.forEach(participantId => {
      if (participantId !== userId) {
        this.socketService.sendToUser(participantId, "screen_share_toggled", {
          callId,
          userId,
          sharing
        });
      }
    });

    this.emit("screen_share_toggled", { callId, userId, sharing });
  }

  // Get WebRTC configuration with ICE servers
  getWebRTCConfig() {
    return {
      iceServers: process.env.NODE_ENV === 'production' ? [
        {
          urls: 'stun:stun.relay.metered.ca:80'
        },
        {
          urls: 'turn:global.relay.metered.ca:80',
          username: process.env.METERED_API_KEY,
          credential: process.env.METERED_SECRET_KEY
        },
        {
          urls: 'turn:global.relay.metered.ca:80?transport=tcp',
          username: process.env.METERED_API_KEY,
          credential: process.env.METERED_SECRET_KEY
        },
        {
          urls: 'turn:global.relay.metered.ca:443',
          username: process.env.METERED_API_KEY,
          credential: process.env.METERED_SECRET_KEY
        },
        {
          urls: 'turns:global.relay.metered.ca:443?transport=tcp',
          username: process.env.METERED_API_KEY,
          credential: process.env.METERED_SECRET_KEY
        }
      ] : [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };
  }

  // Get call statistics
  getCallStats(callId) {
    const call = this.activeCalls.get(callId);
    if (!call) {
      return null;
    }

    return {
      callId,
      participants: call.participants.length,
      duration: call.connectedTime ? Math.floor((new Date() - call.connectedTime) / 1000) : 0,
      status: call.status,
      type: call.callType,
      audioStates: call.audioStates ? Object.fromEntries(call.audioStates) : {},
      videoStates: call.videoStates ? Object.fromEntries(call.videoStates) : {},
      screenSharing: call.screenSharing
    };
  }

  // Clean up inactive calls
  cleanupInactiveCalls() {
    const now = new Date();
    const maxInactiveTime = 5 * 60 * 1000; // 5 minutes

    for (const [callId, call] of this.activeCalls) {
      if (call.status === "ended" && (now - call.endTime) > maxInactiveTime) {
        this.activeCalls.delete(callId);
      } else if (call.status === "initiating" && (now - call.startTime) > 60000) {
        // Auto-end calls that have been initiating for more than 1 minute
        this.endCall(callId, "timeout");
      }
    }
  }
}

module.exports = WebRTCService;

