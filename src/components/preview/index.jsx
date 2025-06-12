import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Card, Button, Tooltip, Divider } from 'antd';
import {
  StepBackwardOutlined,
  FastBackwardOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  FastForwardOutlined,
  StepForwardOutlined,
} from '@ant-design/icons';
import './index.css';

export default function Preview({ videoRef, flat = [], selected = [], onJump }) {
  const [duration,     setDuration]     = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying,   setIsPlaying]   = useState(false);
  const [timeScaleWidth, setTimeScaleWidth] = useState(0);

  const subtitleScrollRef = useRef(null);
  const timeScaleRef      = useRef(null);

  const total = duration;

  const allSegments = useMemo(() =>
    flat.map(s => ({
      ...s,
      selected: selected.includes(s.id)
    }))
  , [flat, selected]);

  const highlightSegments = useMemo(
    () => allSegments.filter(seg => seg.selected),
    [allSegments]
  );

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onLoaded = () => setDuration(v.duration);
    const onTime   = () => setCurrentTime(v.currentTime);
    const onPlay   = () => setIsPlaying(true);
    const onPause  = () => setIsPlaying(false);

    v.addEventListener('loadedmetadata', onLoaded);
    v.addEventListener('timeupdate',       onTime);
    v.addEventListener('play',             onPlay);
    v.addEventListener('pause',            onPause);
    return () => {
      v.removeEventListener('loadedmetadata', onLoaded);
      v.removeEventListener('timeupdate',       onTime);
      v.removeEventListener('play',             onPlay);
      v.removeEventListener('pause',            onPause);
    };
  }, [videoRef]);

  useEffect(() => {
    const sc = subtitleScrollRef.current;
    if (sc) {
      setTimeScaleWidth(sc.scrollWidth);
    }
  }, [allSegments, duration]);

  useEffect(() => {
    const sc = subtitleScrollRef.current;
    const ts = timeScaleRef.current;
    if (!sc || !ts) return;
    const sync = () => { ts.scrollLeft = sc.scrollLeft; };
    sc.addEventListener('scroll', sync);
    return () => { sc.removeEventListener('scroll', sync); };
  }, []);

  const formatTime = useCallback(sec => {
    const m = Math.floor(sec/60).toString().padStart(2,'0');
    const s = Math.floor(sec%60).toString().padStart(2,'0');
    return `${m}:${s}`;
  }, []);

  const handleSeekStart = () => { videoRef.current.currentTime = 0; };
  const handleBack5     = () => { videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5); };
  const handlePlayPause = () => { isPlaying ? videoRef.current.pause() : videoRef.current.play(); };
  const handleForward5  = () => { videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 5); };
  const handleSeekEnd   = () => { videoRef.current.currentTime = duration; };

  const currentSeg = highlightSegments.find(
    seg => currentTime >= seg.start && currentTime <= seg.end
  );

  const ticks = useMemo(() => (
    duration > 0
      ? [0, duration/4, duration/2, duration*3/4, duration]
      : [0,0,0,0,0]
  ), [duration]);

  return (
    <div className="preview-pane">
      <Card className="video-card" bordered={false} bodyStyle={{ padding: 0 }}>
        <div className="video-wrapper">
          <video ref={videoRef} className="video-player" src="/test.mp4" controls={false}/>
          {currentSeg && <div className="overlay-text">{currentSeg.text}</div>}
        </div>
      </Card>

      <Divider className="video-divider" />

      <div className="custom-controls">
        <Tooltip title="Start"><Button className="control-btn" icon={<StepBackwardOutlined />} onClick={handleSeekStart}/></Tooltip>
        <Tooltip title="Back 5s"><Button className="control-btn" icon={<FastBackwardOutlined />} onClick={handleBack5}/></Tooltip>
        <Tooltip title={isPlaying ? 'Pause' : 'Play'}>
          <Button className="play-btn" icon={isPlaying ? <PauseCircleOutlined/> : <PlayCircleOutlined/>} onClick={handlePlayPause}/>
        </Tooltip>
        <Tooltip title="Forward 5s"><Button className="control-btn" icon={<FastForwardOutlined />} onClick={handleForward5}/></Tooltip>
        <Tooltip title="End"><Button className="control-btn" icon={<StepForwardOutlined />} onClick={handleSeekEnd}/></Tooltip>
        <span className="time-display">{formatTime(currentTime)} / {formatTime(duration)}</span>
      </div>

      <div className="subtitle-container">
        <div className="subtitle-scroll" ref={subtitleScrollRef}>
          <div
            className="subtitle-progress-head"
            style={{ left: `${total > 0 ? (currentTime/total)*100 : 0}%` }}
          />
          {allSegments.map(seg => {
            const leftPct  = (seg.start / total) * 100;
            const widthPct = ((seg.end - seg.start) / total) * 100;
            return (
              <Tooltip key={seg.id} title={seg.text}>
                <div
                  className={`subtitle-item ${seg.selected ? '' : 'off'}`}
                  style={{ left:`${leftPct}%`, width:`${widthPct}%` }}
                  onClick={()=>onJump(seg.start)}
                >
                  <span className="subtitle-prefix">T</span>
                  {seg.text.length>30 ? seg.text.slice(0,30)+'…' : seg.text}
                </div>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </div>
);
}
