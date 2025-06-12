import { useState, useCallback } from 'react';
import { Upload, List, Progress, Button, Typography, Space, message } from 'antd';
import {
  InboxOutlined,
  PaperClipOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  SendOutlined,
} from '@ant-design/icons';
import './index.css';

const { Dragger } = Upload;
const { Text } = Typography;

export default function VideoUpload({ onFilesReady }) {
  const [files, setFiles] = useState([]);

  const hasFile = files.some(f => f.status === 'done');

  const customRequest = ({ file, onProgress, onSuccess, onError }) => {
    const uid = file.uid;
    setFiles([{ uid, name: file.name, status: 'uploading', percent: 0, file }]);

    let percent = 0;
    const timer = setInterval(() => {
      percent += 20;
      onProgress({ percent });
      setFiles(fs =>
        fs.map(f =>
          f.uid === uid ? { ...f, percent: Math.min(percent, 100) } : f
        )
      );
      if (percent >= 100) {
        clearInterval(timer);
        const ok = file.size < 50 * 1024 * 1024;
        if (ok) {
          onSuccess('ok');
          setFiles(fs =>
            fs.map(f =>
              f.uid === uid ? { ...f, status: 'done', percent: 100 } : f
            )
          );
        } else {
          onError(new Error('Size too large'));
          setFiles(fs =>
            fs.map(f =>
              f.uid === uid
                ? { ...f, status: 'error', error: 'Max size 50 MB' }
                : f
            )
          );
        }
      }
    }, 300);
  };

  const handleRemove = useCallback(uid => {
    setFiles(fs => fs.filter(f => f.uid !== uid));
  }, []);

  const handleSend = () => {
    const okFiles = files.filter(f => f.status === 'done').map(f => f.file);
    if (okFiles.length) {
      onFilesReady && onFilesReady(okFiles);
    } else {
      message.warning('請先上傳一個合法檔案');
    }
  };

  return (
    <div className="upload-wrapper">
      {!hasFile && (
        <Dragger
          className="dark-dragger"
          multiple={false}
          accept="video/*"
          customRequest={customRequest}
          showUploadList={false}
        >
          <InboxOutlined className="drag-icon" />
          <div className="drag-text">Drag & drop video files here</div>
          <div className="drag-hint">Or click to browse</div>
        </Dragger>
      )}

      <List
        className="file-list"
        dataSource={files}
        renderItem={item => (
          <List.Item
            className={`file-item ${item.status === 'error' ? 'file-error' : ''}`}
            actions={[
              item.status === 'done' ? (
                <CheckCircleOutlined className="icon-success" />
              ) : item.status === 'error' ? (
                <CloseCircleOutlined className="icon-error" />
              ) : null,
              <DeleteOutlined
                onClick={() => handleRemove(item.uid)}
                className="icon-delete"
              />,
            ]}
          >
            <List.Item.Meta
              avatar={<PaperClipOutlined className="file-icon" />}
              title={
                <Space direction="vertical" size={4}>
                  <Text className="file-name">{item.name}</Text>
                  {item.status === 'uploading' && (
                    <Progress percent={item.percent} size="small" showInfo={false} />
                  )}
                  {item.status === 'error' && (
                    <Text type="danger" className="file-error-text">
                      {item.error}
                    </Text>
                  )}
                </Space>
              }
            />
            {item.status === 'done' && (
              <Text className="file-size">
                {(item.file.size / (1024 * 1024)).toFixed(1)} MB
              </Text>
            )}
          </List.Item>
        )}
      />

      {hasFile && (
        <div className="send-btn-wrap">
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            size="large"
          >
            Upload
          </Button>
        </div>
      )}
    </div>
  );
}
