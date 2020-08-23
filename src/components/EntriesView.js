import React, {useState} from 'react';
import EntryWall from './EntryWall';
import EntryTree from './EntryTree';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import SimpleReactLightbox, { SRLWrapper } from "simple-react-lightbox";
export function GalleryView(props) {
  let photos = [];
  if (props.entries) {
    photos = props.entries.reduce((prev, cur) => {
      if (cur.PictureList) {
        prev = prev.concat(cur.PictureList.map((o) => { return {
          src: '/thumbnails/' + o,
          width: 1,
          alt: cur.ZIDString + ': ' + cur.Note + ' (' + o + ')'}; }));
      }
      return prev;
    }, []);
  }
  return <SimpleReactLightbox><SRLWrapper>{photos.map((o) => <img src={o.src} alt={o.alt} className="thumbnail" />)}</SRLWrapper></SimpleReactLightbox>;
}

export default function EntriesView(data) {
  let entries;

  const [ view, setView ] = useState(data.view || 'tree');
  const handleChange = (e, newValue) => {
    setView(newValue);
  };
  if (view === 'cards') {
    entries = <EntryWall {...data} includeDate={true} />;
  } else if (view === 'tree') {
    entries = <EntryTree {...data} sort="category" />;
  } else if (view === 'gallery') {
    entries = <GalleryView {...data} sort="date" />;
  } else {
    entries = <EntryTree {...data} sort="date" />;
  }
  return (<div>
            <Tabs value={view} onChange={handleChange} aria-label="view type" >
              <Tab value="tree" label="Tree"/>
              <Tab value="list" label="List"/>
              <Tab value="cards" label="Cards"/>
              <Tab value="gallery" label="Gallery"/>
            </Tabs>
            {entries}
          </div>);
}
