import { useEffect, useRef, useState, useCallback } from 'react';
import './StudentCameraScanner.css';

export const StudentCameraScanner = ({ onCaptureSuccess, capturedImage, onRetake, mode = 'register' }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [detectionStatus, setDetectionStatus] = useState('idle'); // idle, scanning, detected, counting, captured
  const [countdown, setCountdown] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Capture frame from live video
  const captureFrame = useCallback(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    
    // Draw horizontal flip so image is mirror-accurate
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64Image = canvas.toDataURL('image/jpeg', 0.92);
    setDetectionStatus('captured');
    setCountdown(null);
    onCaptureSuccess(base64Image);
  }, [onCaptureSuccess]);

  // Face Detection Loop
  const runDetectionLoop = useCallback(() => {
    if (!videoRef.current || !cameraActive || detectionStatus === 'captured') return;

    const video = videoRef.current;
    if (video.readyState >= 2) {
      // Analyze current video frame
      let hasFace = false;

      // 1. Try Native Browser FaceDetector API if supported
      if ('FaceDetector' in window) {
        try {
          const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 2 });
          detector.detect(video).then((faces) => {
            if (faces && faces.length === 1) {
              handleFaceDetected();
            } else if (faces && faces.length > 1) {
              setDetectionStatus('multiple_faces');
            } else {
              setDetectionStatus('scanning');
              setFaceDetected(false);
            }
          }).catch(() => {
            // Fallback to biometric oval analyzer
            runCanvasLumaDetection(video);
          });
          return;
        } catch {
          // Fall through to fallback
        }
      }

      runCanvasLumaDetection(video);
    }

    if (cameraActive && detectionStatus !== 'captured') {
      animFrameRef.current = requestAnimationFrame(runDetectionLoop);
    }
  }, [cameraActive, detectionStatus]);

  // Biometric Frame Analyzer (Skin-tone & Facial Focus across camera)
  const runCanvasLumaDetection = (video) => {
    try {
      const offscreen = document.createElement('canvas');
      offscreen.width = 120;
      offscreen.height = 120;
      const ctx = offscreen.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, 120, 120);
      const imgData = ctx.getImageData(15, 10, 90, 100);
      const data = imgData.data;

      let skinMatches = 0;
      let totalPixels = data.length / 4;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // Human skin tone locus in RGB space
        if (r > 60 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 10) {
          skinMatches++;
        }
      }

      const skinRatio = skinMatches / totalPixels;
      if (skinRatio > 0.15 && skinRatio < 0.95) {
        handleFaceDetected();
      } else {
        setDetectionStatus('scanning');
        setFaceDetected(false);
      }
    } catch {
      // ignore
    }
  };

  // When face is detected: Start 2-second quick countdown
  const handleFaceDetected = () => {
    if (detectionStatus === 'counting' || detectionStatus === 'captured') return;

    setFaceDetected(true);
    setDetectionStatus('detected');

    // Quick automatic countdown: 2 -> 1 -> Capture
    let timer = 2;
    setCountdown(timer);
    setDetectionStatus('counting');

    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    countdownIntervalRef.current = setInterval(() => {
      timer -= 1;
      if (timer > 0) {
        setCountdown(timer);
      } else {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
        captureFrame();
      }
    }, 1000);
  };

  // Start Camera handler
  const startCamera = async () => {
    setCameraError('');
    setDetectionStatus('scanning');
    setCountdown(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported by your browser. Please use Chrome, Edge, or Firefox.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraActive(true);
          animFrameRef.current = requestAnimationFrame(runDetectionLoop);
        };
      }
    } catch (err) {
      console.error('Camera initialization error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera permissions in your browser bar.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device. Please connect a webcam.');
      } else {
        setCameraError('Camera is currently unavailable or in use by another application.');
      }
      setCameraActive(false);
    }
  };

  // Retake face
  const handleRetakeClick = () => {
    setDetectionStatus('scanning');
    setCountdown(null);
    setFaceDetected(false);
    onRetake();
    if (!cameraActive) {
      startCamera();
    }
  };

  return (
    <div className="camera-scanner-wrapper">
      <div className="camera-viewport-card">
        {/* Live Camera Video View */}
        <div className="video-container">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`live-video-element ${cameraActive ? 'active' : 'hidden'}`}
          />

          {/* If camera is not active and no photo taken */}
          {!cameraActive && !capturedImage && (
            <div className="camera-standby-placeholder">
              <div className="standby-icon-circle">
                <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#2563eb" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
              <h4 className="standby-title">Live Biometric Camera</h4>
              <p className="standby-desc">
                Live webcam capture is required for student hostel verification.
              </p>
              <button
                type="button"
                className="start-camera-action-btn"
                onClick={startCamera}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span>Start Camera</span>
              </button>
            </div>
          )}

          {/* Real Face Scanner Overlay when camera is active (Open Viewfinder - No Rounded Oval) */}
          {cameraActive && (
            <div className="face-guide-overlay">
              {/* Open Viewfinder Corners without rounded circle */}
              <div
                className={`face-scanner-box ${faceDetected ? 'box-detected' : 'box-searching'}`}
              >
                <div className="corner-bracket corner-tl"></div>
                <div className="corner-bracket corner-tr"></div>
                <div className="corner-bracket corner-bl"></div>
                <div className="corner-bracket corner-br"></div>
                <div className="laser-scan-line"></div>
              </div>

              {/* Status Badge */}
              <div className="guide-instructions-badge">
                {detectionStatus === 'counting' ? (
                  <span className="badge-counting">Hold still! Capturing in {countdown}...</span>
                ) : faceDetected ? (
                  <span className="badge-detected">Face Detected ✓</span>
                ) : detectionStatus === 'multiple_faces' ? (
                  <span className="badge-warning">Multiple faces detected. Only 1 face allowed.</span>
                ) : (
                  <span className="badge-searching">Look at camera for biometric scan</span>
                )}
              </div>

              {/* Big Countdown Number */}
              {countdown !== null && (
                <div className="countdown-overlay-number">
                  <span>{countdown}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Camera Error Message */}
        {cameraError && (
          <div className="camera-error-banner" role="alert">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#dc2626" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{cameraError}</span>
          </div>
        )}

        {/* Live Controls */}
        {cameraActive && (
          <div className="camera-live-controls">
            <button
              type="button"
              className="manual-capture-btn"
              onClick={captureFrame}
              title="Manual Capture"
            >
              <span>Capture Now</span>
            </button>
            <button
              type="button"
              className="stop-camera-btn"
              onClick={stopCamera}
            >
              <span>Stop Camera</span>
            </button>
          </div>
        )}
      </div>

      {/* 5. CAPTURED FACE IMAGE PROFILE SECTION */}
      {capturedImage && (
        <div className="captured-face-profile-card">
          <div className="captured-badge-header">
            <span className="scan-success-dot"></span>
            <span className="scan-success-text">
              {mode === 'verify' ? 'Live Face Frame Captured' : 'Face Scan Successful'}
            </span>
          </div>
          <div className="captured-photo-display">
            <img src={capturedImage} alt="Captured Face" className="captured-photo-img" />
          </div>
          {mode !== 'verify' && (
            <p className="captured-photo-note">
              This live biometric photo will be registered with your Girls Hostel ID.
            </p>
          )}
          <button
            type="button"
            className="retake-face-btn"
            onClick={handleRetakeClick}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M1 4v6h6" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            <span>Retake Face</span>
          </button>
        </div>
      )}
    </div>
  );
};
