import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import Typography from '@material-ui/core/Typography';
import Masonry from 'react-masonry-css';
import PhotoList from './PhotoList';
import { Link } from 'react-router-dom';
import './EntryWall.css';
import EntryNote from '../components/EntryNote';
import EntryForm from '../components/EntryForm';
import EditIcon from '@material-ui/icons/Edit';
import InsertLinkIcon from '@material-ui/icons/InsertLink';
import IconButton from '@material-ui/core/IconButton';
import CardActions from '@material-ui/core/CardActions';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';

const useStyles = makeStyles(() => ({
  root: {
    margin: 20
  },
  card: {
    minWidth: 275,
    margin: 5,
    fontSize: 20,
    '& img': {
      objectFit: 'contain'
    },
    '&.selected': {
      border: '2px solid yellow' 
    }
  },
  bullet: {
    display: 'inline-block',
    margin: '0 2px',
    transform: 'scale(0.8)',
  },
  title: {
    fontSize: 14,
  },
  pos: {
    marginBottom: 12,
  },
}));

export function EntryCard(data) {
  const classes = useStyles();
  const [entry, setEntry] = useState(data.entry);
  useEffect(() => { setEntry(data.entry); }, [data.entry]);
  const [isEditing, setEditing] = useState(false);
  let onSubmit = function(res) {
    setEditing(false);
    setEntry(res);
    if (data.onSubmit) { data.onSubmit(); }
  };
  const FeaturedImage = () => {
    if (entry.PictureList && entry.PictureList.length > 0) {
      return <CardMedia component="img" loading="lazy" height="300" image={"/thumbnails/" + encodeURIComponent(entry.PictureList[0])} />;
    } else {
      return null;
    }
  };
  
  let classNames = classes.card;
  if (data.selected && data.selected.indexOf(entry.ZIDString) >= 0) {
    classNames += ' selected';
  }
  return (<Card key={entry.ID} className={classNames} onClick={(e) => data.onClick && data.onClick(e, entry)}>
            <CardHeader subheader={<Link to={'/zid/' + entry.ZIDString}>{data.includeDate ? entry.ZIDString : ''}</Link>} title={entry.Category || 'Uncategorized'} />
            <FeaturedImage />
            <CardContent>
              {isEditing
               ? <EntryForm entry={entry} onSubmit={onSubmit} />
               : (<Typography variant="body2">
                    <EntryNote value={entry.Note}/> <EntryNote className="other" value={entry.Other}/>
                  </Typography>)}
            </CardContent>
            <PhotoList data={entry.PictureList && entry.PictureList.slice(1)} />
            <CardActions>
              <IconButton to={"/entries/" + entry.ID} component={Link}><EditIcon fontSize="small"/></IconButton>
              <IconButton onClick={(e) => data.onClick && data.onClick(e, entry)}><InsertLinkIcon fontSize="small"/></IconButton>
            </CardActions>
          </Card>
         );
}

export default function EntryWall(data) {
  const classes = useStyles();
  const breakpoints = { default: 3, 1000: 1 };
  if (data && data.length === 0) {
    return <div/>;
  }
  else return (
    <div className={classes.root}>
      <Masonry breakpointCols={breakpoints} className="my-masonry-grid" columnClassName="my-masonry-grid-column">
        {data && data.entries && data.entries.map((entry) => {
          return (<EntryCard onClick={data.onClick} selected={data.selected} includeDate={data.includeDate} key={entry.ID} entry={entry} />
                 );                    
        })}
      </Masonry>
    </div>
  );
}
