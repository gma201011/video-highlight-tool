import { useState, useRef, useEffect } from 'react';
import { Layout, Card, message } from 'antd';
import { VideoCameraOutlined } from '@ant-design/icons';
import VideoUpload from './components/VideoUpload';
import Transcript from './components/transcript';
import Preview from './components/preview';
import './App.css';

const { Header, Content } = Layout;

export default function App() {
  const containerRef = useRef(null);
  const dragging = useRef(false);

  const [leftW, setLeftW] = useState(350);
  const [collapsed, setCollapsed] = useState(false);

  const [videoUrl, setVideoUrl] = useState('');

  const [data, setData] = useState(null);
  const [flat, setFlat] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [currentSegment, setCurrentSegment] = useState(null);

  const videoRef = useRef(null);

  useEffect(() => {
    const onMouseMove = e => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let nw = e.clientX - rect.left;
      const min = rect.width * 0.25;
      const max = rect.width * 0.5;
      if (nw < min) nw = min;
      if (nw > max) nw = max;
      setLeftW(nw);
    };
    const onMouseUp = () => {
      dragging.current = false;
      containerRef.current.classList.remove('noselect');
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const handleFilesReady = files => {
    if (files.length === 0) return;
    const url = URL.createObjectURL(files[0]);
    setVideoUrl(url);
  };

  useEffect(() => {
    if (!videoUrl) return;
    fetch('/mock.json')
      .then(r => r.json())
      .then(json => {
        setData(json);
        const _flat = json.sections.flatMap((sec, si) =>
          sec.sentences.map((s, i) => ({
            ...s,
            id: `${si}-${i}`,
            section: sec.title
          }))
        );
        setFlat(_flat);
      })
      .catch(err => {
        console.error(err);
        message.error('Read mock data failed');
      });
  }, [videoUrl]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      const t = v.currentTime;
      const found = [...flat].reverse().find(s => s.start <= t && t <= s.end);
      if (found && found.id !== currentId) {
        setCurrentId(found.id);
      }
    };
    v.addEventListener('timeupdate', onTime);
    return () => v.removeEventListener('timeupdate', onTime);
  }, [flat, currentId]);

  const jumpTo = (t, seg) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = t;
    setCurrentSegment(seg);
    videoRef.current.play();
  };

  const toggle = id => {
    setFlat(prev =>
      prev.map(seg =>
        seg.id === id ? { ...seg, highlight: !seg.highlight } : seg
      )
    );
  };

  return (
    <Layout className="app-container">
      <Header className="app-header">
        <VideoCameraOutlined style={{ marginRight: 8, fontSize: 20 }} />
        Video Highlight Tool
      </Header>
      <Content className="app-content">
        {!videoUrl && (
          <div className="upload-container">
            <VideoUpload onFilesReady={handleFilesReady} />
          </div>
        )}

        {videoUrl && data && (
          <div ref={containerRef} className="cards-container">
            {!collapsed && (
              <Card
                className="transcript-card"
                bordered={false}
                style={{
                  flex: `0 0 ${leftW}px`,
                  height: '100%',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: '#13131b',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.4)'
                }}
                bodyStyle={{ padding: 0, display: 'flex', flexDirection: 'column' }}
              >
                <Transcript
                  width="100%"
                  sections={data.sections}
                  flat={flat}
                  currentId={currentId}
                  onToggle={toggle}
                  onJump={jumpTo}
                  setCurrentSegment={setCurrentSegment}
                />
              </Card>
            )}
            <Card
              className="preview-card"
              bordered={false}
              style={{
                flex: 1,
                height: '100%',
                borderRadius: '16px',
                overflow: 'hidden',
                background: '#1e1e29',
                boxShadow: '0 8px 16px rgba(0,0,0,0.4)'
              }}
              bodyStyle={{ padding: 0, display: 'flex', flexDirection: 'column' }}
            >
              <Preview
                videoRef={videoRef}
                flat={flat}
                onJump={jumpTo}
                currentSegment={currentSegment}
                setCurrentSegment={setCurrentSegment}
                currentId={currentId}
                isCollapsed={collapsed}
                onExpand={() => setCollapsed(false)}
                videoUrl={videoUrl}
              />
            </Card>
          </div>
        )}
      </Content>
    </Layout>
  );
}
