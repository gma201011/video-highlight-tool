import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Layout, Card } from 'antd';
import { VideoCameraOutlined } from '@ant-design/icons';
import Transcript from './components/transcript';
import Preview from './components/preview';
import './App.css';

const { Header, Content } = Layout;

export default function App() {
  const containerRef = useRef(null);
  const dragging = useRef(false);

  const [leftW, setLeftW] = useState(350);
  const [collapsed, setCollapsed] = useState(false);
  const [data, setData] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const videoRef = useRef(null);

  const onMouseDown = () => {
    dragging.current = true;
    containerRef.current.classList.add('noselect');
  };
  const onMouseMove = (e) => {
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
  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  useEffect(() => {
    fetch('/mock.json')
      .then(r => r.json())
      .then(json => {
        const timeMap = new Map(
          json.sections.map(item => [
            item.sentences,
            { start: item.start, end: item.end + 1 }
          ])
        );
        const correctedSections = json.sections.map(sec => ({
          ...sec,
          sentences: sec.sentences.map(s => ({
            ...s,
            ...(timeMap.get(s.text) || {})
          }))
        }));
        const newData = {
          ...json,
          sections: correctedSections
        };
        setData(newData);

        const init = correctedSections
          .flatMap((sec, si) =>
            sec.sentences.map((s, i) => ({ id: `${si}-${i}`, highlight: s.highlight }))
          )
          .filter(x => x.highlight)
          .map(x => x.id);
        setSelectedIds(init);
      })
      .catch(console.error);
  }, []);

  const flat = useMemo(() => {
    if (!data) return [];
    return data.sections.flatMap((sec, si) =>
      sec.sentences.map((s, i) => ({
        ...s,
        id: `${si}-${i}`,
        section: sec.title
      }))
    );
  }, [data]);

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
    return () => {
      v.removeEventListener('timeupdate', onTime);
    };
  }, [flat, currentId]);
  
  const jumpTo = t => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = t;
    videoRef.current.play();
  };
  const toggle = id =>
    setSelectedIds(ids =>
      ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]
    );

  if (!data) return <div className="loading">Loading…</div>;

  return (
    <Layout className="app-container">
      <Header className="app-header">
        <VideoCameraOutlined style={{ marginRight: 8, fontSize: 20 }} />
        Video Highlight Tool
      </Header>
      <Content className="app-content">
        <div ref={containerRef} className="cards-container">
          {!collapsed && (
            <>
              <Card
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
                  selected={selectedIds}
                  currentId={currentId}
                  onToggle={toggle}
                  onJump={jumpTo}
                  onCollapse={() => setCollapsed(true)}
                />
              </Card>
              <div className="resizer" onMouseDown={onMouseDown} />
            </>
          )}
          <Card
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
              selected={selectedIds}
              onJump={jumpTo}
              isCollapsed={collapsed}
              onExpand={() => setCollapsed(false)}
            />
          </Card>
        </div>
      </Content>
    </Layout>
  );
}
