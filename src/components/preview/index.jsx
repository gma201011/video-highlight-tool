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
  const [isReady, setIsReady] = useState(false);

  const highlightSegments = useMemo(
    () => flat.filter(s => s.highlight).map(s => ({ ...s, end: s.end + 1 })),
    [flat]
  );

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onLoadedMeta = () => setDuration(v.duration);
    const onCanPlayThrough = () => setIsReady(true);

    v.addEventListener('loadedmetadata', onLoadedMeta);
    v.addEventListener('canplaythrough', onCanPlayThrough);

    return () => {
      v.removeEventListener('loadedmetadata', onLoadedMeta);
      v.removeEventListener('canplaythrough', onCanPlayThrough);
    };
  }, [videoRef]);

  useEffect(() => {
    if (!currentSegment && highlightSegments.length > 0 && duration > 0) {
      setCurrentSegment(highlightSegments[0]);
    }
  }, [highlightSegments, currentSegment, duration, setCurrentSegment]);

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

      if (currentSegment && now >= currentSegment.end + 1) {
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

  const formatTime = useCallback(sec => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(Math.floor(sec % 60)).padStart(2, '0');
    return `${m}:${s}`;
  }, []);

  const handleSubtitleClick = (start) => {
    if (!isReady) return;
    const seg = flat.find(s => s.start === start);
    setCurrentSegment(seg);
    onJump?.(start, seg);
  };

  const handleSeekStart = () => {
    if (!isReady || highlightSegments.length === 0) return;
    const first = highlightSegments[0];
    setCurrentSegment(first);
    onJump?.(first.start, first);
  };

  const handlePlayPause = () => {
    if (!isReady) return;
    const v = videoRef.current;
    isPlaying ? v.pause() : v.play();
  };

  const handleSeekEnd = () => {
    if (!isReady || highlightSegments.length === 0) return;
    const last = highlightSegments[highlightSegments.length - 1];
    setCurrentSegment(last);
    onJump?.(last.start, last);
  };

  const overlayText = currentSegment ? currentSegment.text : null;

  return (
    <div className="preview-pane">
      <Card className="video-card" bordered={false} bodyStyle={{ padding: 0, position: 'relative' }}>
        <div className="video-wrapper">
          <video
            ref={videoRef}
            className="video-player"
            src={videoUrl}
            controls={false}
            playsInline
            webkit-playsinline="true"
          />
          {!isReady && (
            <div className="loading-overlay">
              Loading…
            </div>
          )}
          {overlayText && <div className="overlay-text">{overlayText}</div>}
        </div>
      </Card>

      <Divider className="video-divider" />

      <div className="custom-controls">
        <Button
          className="control-btn"
          icon={<StepBackwardOutlined />}
          onClick={handleSeekStart}
          disabled={!isReady}
        />
        <Button
          className="play-btn"
          icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
          onClick={handlePlayPause}
          disabled={!isReady}
        />
        <Button
          className="control-btn"
          icon={<StepForwardOutlined />}
          onClick={handleSeekEnd}
          disabled={!isReady}
        />
        <span className="time-display">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      <div className="subtitle-container">
        <div className="subtitle-scroll">
          <div
            className="subtitle-progress-head"
            style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%` }}
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
