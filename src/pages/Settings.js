import React, { useState } from 'react';
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';

export default function Settings() {
  const [ message, setMessage ] = useState('');
  const exportCSV = () => {
    fetch('/api/export', {method: 'POST'}).then(setMessage('Exported'));
  };
  const makeThumbnails = () => {
    fetch('/api/makeThumbs', {method: 'POST'}).then(setMessage('Made thumbnails'));
  };
  const importIntoDB = () => {
    fetch('/api/importIntoDB', {method: 'POST'}).then(setMessage('Imported'));
  };
  return (
    <div className="App">
      <div>{message}</div>
      <ButtonGroup>
        <Button onClick={makeThumbnails}>Make thumbnails</Button>
        <Button onClick={exportCSV}>Export</Button>
        <Button onClick={importIntoDB}>Import</Button>
      </ButtonGroup>
    </div>
  );
}
