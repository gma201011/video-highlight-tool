import { useEffect, useRef } from 'react';
import { Typography, Checkbox, Button, Divider } from 'antd';
import './index.css';

const { Title, Text } = Typography;

function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function Transcript({
  width,
  sections = [],
  selected = [],
  currentId,
  onToggle,
  onJump,
  onCollapse
}) {
  const refs = useRef({});

  useEffect(() => {
    if (currentId && refs.current[currentId]) {
      refs.current[currentId].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentId]);

  return (
    <div className="transcript-pane" style={{ width }}>
      <div className="transcript-header-wrapper">
        <div className="transcript-header">
          <Title level={4} className="pane-title">Transcript</Title>
        </div>
        <Divider className="transcript-divider" style={{ borderColor: '#2b2b32', margin: 0 }} />
      </div>

      <div className="transcript-body">
        {sections.map((sec, si) => (
          <div key={si} className="section">
            <Text strong className="section-title">{sec.title}</Text>
            {sec.sentences.map((s, i) => {
              const id = `${si}-${i}`;
              const isCur = id === currentId;
              return (
                <div
                  key={id}
                  ref={el => refs.current[id] = el}
                  className={`transcript-item ${selected.includes(id) ? 'selected' : ''} ${isCur ? 'current' : ''}`}
                  onClick={() => onJump(s.start)}
                >
                  <Checkbox
                    checked={selected.includes(id)}
                    onClick={e => e.stopPropagation()}
                    onChange={e => { e.stopPropagation(); onToggle(id); }}
                  />
                  <Text className="time-stamp">[{formatTime(s.start)}]</Text>
                  <Text className="sentence">{s.text}</Text>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
