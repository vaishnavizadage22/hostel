import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { Footer } from '../components/Footer';
import './HostelGatePage.css';

export const HostelGatePage = () => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Mode Selection: 'OUT' (default) or 'IN'
  const [movementType, setMovementType] = useState('OUT');
  const [studentIdInput, setStudentIdInput] = useState('');

  // Camera & Detection States
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null); // success response
  const [errorMessage, setErrorMessage] = useState('');

  // Today's Movements Log
  const [todayLogs, setTodayLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Fetch today's gate logs
  const fetchTodayLogs = useCallback(async () => {
    try {
      setIsLoadingLogs(true);
      const logs = await api.getTodayHostelMovements();
      setTodayLogs(logs || []);
    } catch (err) {
      console.error('Failed to load gate logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayLogs();
  }, [fetchTodayLogs]);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Start Camera
  const startCamera = async () => {
    setCameraError('');
    setErrorMessage('');
    setScanResult(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported by your browser.');
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
        };
      }
    } catch (err) {
      console.error('Gate camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera permissions in your browser address bar.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No webcam found on this device. Please connect a camera.');
      } else {
        setCameraError('Camera is currently unavailable or in use by another application.');
      }
      setCameraActive(false);
    }
  };

  // Capture Frame and Trigger Face Verification Movement API
  const handleScanFace = async () => {
    if (!videoRef.current || !cameraActive) {
      setErrorMessage('Please start the camera first before scanning.');
      return;
    }

    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setErrorMessage('Camera video feed is not ready. Please try again.');
      return;
    }

    setErrorMessage('');
    setScanResult(null);
    setIsScanning(true);

    try {
      // 1. Capture snapshot from video
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      // Mirror horizontal for natural web cam perspective
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const base64Image = canvas.toDataURL('image/jpeg', 0.92);

      // 2. Call Real Backend Biometric Movement API
      const payload = {
        movement_type: movementType,
        face_image_base64: base64Image,
        student_id: studentIdInput.trim() ? studentIdInput.trim() : undefined,
      };

      const res = await api.recordHostelMovement(payload);

      // 3. Match Succeeded!
      setScanResult(res);
      setErrorMessage('');
      // Refresh today's logs
      fetchTodayLogs();
    } catch (err) {
      console.error('Gate biometric verification failed:', err);
      setErrorMessage(err.message || 'Face verification failed. Access denied.');
      setScanResult(null);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="hostel-gate-page-wrapper">
      <main className="hostel-gate-container">
        {/* Top Header */}
        <header className="gate-header-section">
          <div className="gate-badge">
            <span className="live-indicator-dot"></span>
            <span>Girls Hostel Security Gate Control</span>
          </div>
          <h1 className="gate-title">Hostel Gate Face Scanner</h1>
          <p className="gate-subtitle">
            Automated biometric entry & exit terminal. Real face matching with server-synchronized timestamps.
          </p>
        </header>

        <div className="gate-main-grid">
          {/* Left Column: Camera Scanner & Mode Selection */}
          <div className="gate-camera-card">
            {/* Mode Selection */}
            <div className="gate-mode-selector-wrapper">
              <span className="mode-label">Select Movement Mode:</span>
              <div className="mode-buttons-group">
                <button
                  type="button"
                  className={`btn-mode btn-mode-out ${movementType === 'OUT' ? 'active-out' : ''}`}
                  onClick={() => setMovementType('OUT')}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>HOSTEL OUT</span>
                </button>

                <button
                  type="button"
                  className={`btn-mode btn-mode-in ${movementType === 'IN' ? 'active-in' : ''}`}
                  onClick={() => setMovementType('IN')}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                  <span>HOSTEL IN</span>
                </button>
              </div>
            </div>

            {/* Optional Student ID Filter */}
            <div className="gate-student-id-bar">
              <label htmlFor="gateStudentId" className="id-filter-label">
                Student ID (Optional / Auto-detect):
              </label>
              <input
                type="text"
                id="gateStudentId"
                placeholder="e.g. vaishnavi@123 (or leave blank to auto-detect)"
                value={studentIdInput}
                onChange={(e) => setStudentIdInput(e.target.value)}
                className="gate-id-input"
              />
            </div>

            {/* Camera Viewport */}
            <div className="gate-video-viewport">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`gate-live-video ${cameraActive ? 'active' : 'hidden'}`}
              />

              {!cameraActive && (
                <div className="gate-standby-view">
                  <div className="standby-cam-icon">
                    <svg viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="#2563eb" strokeWidth="1.8">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </div>
                  <h3>Gate Terminal Camera Standby</h3>
                  <p>Click "Start Camera" to initialize the live biometric gate scanner.</p>
                  <button type="button" className="btn-gate-start-cam" onClick={startCamera}>
                    Start Camera
                  </button>
                </div>
              )}

              {/* Viewfinder when camera active */}
              {cameraActive && (
                <div className="gate-viewfinder-overlay">
                  <div className="viewfinder-box">
                    <div className="vf-corner vf-tl"></div>
                    <div className="vf-corner vf-tr"></div>
                    <div className="vf-corner vf-bl"></div>
                    <div className="vf-corner vf-br"></div>
                    <div className="vf-scan-beam"></div>
                  </div>
                  <div className="vf-status-badge">
                    <span>Look directly at camera • Mode: HOSTEL {movementType}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Camera Controls */}
            {cameraActive && (
              <div className="gate-controls-bar">
                <button
                  type="button"
                  className="btn-control btn-scan-face"
                  onClick={handleScanFace}
                  disabled={isScanning}
                >
                  {isScanning ? (
                    <span>Verifying Face Biometrics...</span>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                      <span>Scan Face ({movementType})</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="btn-control btn-stop-cam"
                  onClick={stopCamera}
                  disabled={isScanning}
                >
                  Stop Camera
                </button>
              </div>
            )}

            {/* Error Banners */}
            {cameraError && (
              <div className="gate-alert-banner alert-danger" role="alert">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#dc2626" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{cameraError}</span>
              </div>
            )}

            {errorMessage && (
              <div className="gate-alert-banner alert-danger" role="alert">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#dc2626" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Right Column: Verification Result Card */}
          <div className="gate-result-card">
            <h2 className="result-card-heading">Verification Status</h2>

            {scanResult ? (
              <div className="result-success-container">
                <div className="success-badge-icon">
                  <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#059669" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>

                <div className="success-title-box">
                  <span className="status-chip chip-approved">Face Verified Successfully</span>
                  <h3 className="success-action-title">
                    Hostel {scanResult.movement_type} recorded successfully
                  </h3>
                </div>

                <div className="movement-details-table">
                  <div className="detail-row">
                    <span className="label">Student Name:</span>
                    <strong className="val val-name">{scanResult.student_name}</strong>
                  </div>
                  <div className="detail-row">
                    <span className="label">Student ID:</span>
                    <strong className="val val-id">{scanResult.student_id}</strong>
                  </div>
                  <div className="detail-row">
                    <span className="label">Action:</span>
                    <span className={`movement-tag tag-${scanResult.movement_type.toLowerCase()}`}>
                      Hostel {scanResult.movement_type}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Current Date:</span>
                    <strong className="val">{scanResult.movement_date}</strong>
                  </div>
                  <div className="detail-row">
                    <span className="label">Server Time:</span>
                    <strong className="val val-time">{scanResult.movement_time}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="result-empty-placeholder">
                <div className="placeholder-icon">
                  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#94a3b8" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="6" x2="12" y2="12" />
                    <line x1="12" y1="12" x2="16" y2="14" />
                  </svg>
                </div>
                <h4>Awaiting Face Scan</h4>
                <p>
                  Center the student in the camera frame, choose <strong>HOSTEL OUT</strong> or{' '}
                  <strong>HOSTEL IN</strong>, and click <strong>Scan Face</strong>.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Live Today's Gate Activity Log */}
        <section className="gate-logs-section">
          <div className="logs-header">
            <h3>Today's Gate Movement Records</h3>
            <button type="button" className="btn-refresh-logs" onClick={fetchTodayLogs} disabled={isLoadingLogs}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              <span>{isLoadingLogs ? 'Refreshing...' : 'Refresh Logs'}</span>
            </button>
          </div>

          <div className="logs-table-wrapper">
            {todayLogs.length === 0 ? (
              <p className="no-logs-msg">No hostel movements recorded today yet.</p>
            ) : (
              <table className="gate-logs-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Student Name</th>
                    <th>Student ID</th>
                    <th>Action</th>
                    <th>Date</th>
                    <th>Biometrics</th>
                  </tr>
                </thead>
                <tbody>
                  {todayLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="log-time">{log.time}</td>
                      <td className="log-name">{log.student_name}</td>
                      <td className="log-id">{log.student_id}</td>
                      <td>
                        <span className={`log-badge badge-${log.movement_type.toLowerCase()}`}>
                          Hostel {log.movement_type}
                        </span>
                      </td>
                      <td>{log.date}</td>
                      <td>
                        <span className="biometric-check-tag">Face Verified ✓</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
