import { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, Button, Tooltip, Divider } from 'antd';
import {
  StepBackwardOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepForwardOutlined,
} from '@ant-design/icons';
import './index.css';

export default function Preview({
  videoRef,
  flat = [],
  onJump,
  currentSegment,
  setCurrentSegment,
  currentId,
  videoUrl
}) {
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const highlightSegments = useMemo(
    () => flat.filter(s => s.highlight).map(s => ({ ...s, end: s.end + 1 })),
    [flat]
  );

  useEffect(() => {
    if (
      !currentSegment &&
      highlightSegments.length > 0 &&
      duration > 0
    ) {
      setCurrentSegment(highlightSegments[0]);
    }
  }, [highlightSegments, currentSegment, duration, setCurrentSegment]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onLoaded = () => setDuration(v.duration);
    v.addEventListener('loadedmetadata', onLoaded);
    return () => v.removeEventListener('loadedmetadata', onLoaded);
  }, [videoRef]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !currentSegment) return;
    v.currentTime = currentSegment.start;
  }, [currentSegment, videoRef]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTime = () => {
      const now = v.currentTime;
      setCurrentTime(now);
      if (!currentSegment) return;
      if (now >= currentSegment.end + 1) {
        const nextHighlight = highlightSegments.find(s => s.start > currentSegment.end - 1);
        if (nextHighlight) {
          setCurrentSegment(nextHighlight);
        } else {
          v.pause();
        }
      }
    };
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('timeupdate', onTime);
    return () => {
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('timeupdate', onTime);
    };
  }, [videoRef, currentSegment, highlightSegments, setCurrentSegment]);

  const handleSubtitleClick = (start) => {
    const seg = flat.find(s => s.start === start);
    setCurrentSegment(seg);
    if (onJump) onJump(start, seg);
  };

  const formatTime = useCallback(sec => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(Math.floor(sec % 60)).padStart(2, '0');
    return `${m}:${s}`;
  }, []);

  const handleSeekStart = () => {
    if (highlightSegments.length > 0) {
      setCurrentSegment(highlightSegments[0]);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.pause();
      }, 0);
      if (onJump) onJump(highlightSegments[0].start, highlightSegments[0]);
    }
  };

  const handlePlayPause = () => { isPlaying ? videoRef.current.pause() : videoRef.current.play(); };

  const handleSeekEnd = () => {
    if (highlightSegments.length > 0) {
      setCurrentSegment(highlightSegments[highlightSegments.length - 1]);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.pause();
      }, 0);
      if (onJump) onJump(highlightSegments[highlightSegments.length - 1].start, highlightSegments[highlightSegments.length - 1]);
    }
  };

  const overlayText = currentSegment ? currentSegment.text : null;

  return (
    <div className="preview-pane">
      <Card className="video-card" bordered={false} bodyStyle={{ padding: 0 }}>
        <div className="video-wrapper">
          <video
            ref={videoRef}
            className="video-player"
            // src={videoUrl}
            src={"./test.mp4"}
            controls={false}
          />
          {overlayText && <div className="overlay-text">{overlayText}</div>}
        </div>
      </Card>

      <Divider className="video-divider" />

      <div className="custom-controls">
        <Tooltip title="Start"><Button className="control-btn" icon={<StepBackwardOutlined />} onClick={handleSeekStart} /></Tooltip>
        <Tooltip title={isPlaying ? 'Pause' : 'Play'}>
          <Button className="play-btn"
            icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={handlePlayPause} />
        </Tooltip>
        <Tooltip title="End"><Button className="control-btn" icon={<StepForwardOutlined />} onClick={handleSeekEnd} /></Tooltip>
        <span className="time-display">{formatTime(currentTime)} / {formatTime(duration)}</span>
      </div>

      <div className="subtitle-container">
        <div className="subtitle-scroll">
          <div
            className="subtitle-progress-head"
            style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
          {flat.map(seg => {
            const leftPct = (seg.start / duration) * 100;
            const widthPct = ((seg.end - seg.start) / duration) * 100;
            const isCurrent = seg.id === currentId;
            return (
              <Tooltip key={seg.id} title={seg.text}>
                <div
                  className={`subtitle-item ${seg.highlight ? '' : 'off'}${isCurrent ? ' current' : ''}`}
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                  onClick={() => handleSubtitleClick(seg.start)}
                >
                  <span className="subtitle-prefix">T</span>
                  {seg.text.length > 30 ? seg.text.slice(0, 30) + '…' : seg.text}
                </div>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </div>
  );
}
