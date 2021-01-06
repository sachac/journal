import React, { useState, useEffect } from 'react';
import history from "../history";
import PropTypes from 'prop-types';
// import { HotKeys } from "react-hotkeys";
import Button from '@material-ui/core/Button';
import PhotoList from '../components/PhotoList';
import { QuickEntryForm } from '../components/EntryForm';
import { DatePicker } from '@material-ui/pickers';
import EntriesView from '../components/EntriesView';
import BulkOperations, { SelectedInfo } from '../components/BulkOperations';
import { Link, useParams } from "react-router-dom";
import ButtonGroup from '@material-ui/core/ButtonGroup';
import moment from 'moment';
// const keyMap = {
//     PREVIOUS: "left",
//     NEXT: "right"
// };

import useSelectEntries from '../hooks/useSelectEntries';

export function DayEntriesView(props) {
  let date = props.date;
  const [ lastEntry, setLastEntry ] = useState();
  const [ selected, setSelected ] = useState([]);
  const handlePhotoClick = (e, p) => {
    setSelected((selected.includes(p)) ? selected.filter(d => d !== p) : selected.concat(p));
  };
  const [ entries ] = useState([]);
  const { selectedEntries, clickEntry, clearSelection, selectAll } = useSelectEntries({entries});
  const handleEntryClick = (event, entry) => {
    if (selected.length > 0) {
      fetch('/api/entries/' + entry.ID + '/pictures', {
        method: 'POST',
        headers: {'Content-Type': 'application/json' },
        body: JSON.stringify({filenames: selected})
      }).then(() => {
        setLastEntry(entry);
        setSelected([]);
        props.getData && props.getData();
      });
    } else {
      clickEntry(event, entry);
    }
  };
  
  const handlePhotoDelete = () => {
    if (selected.length === 0) return null;
    return Promise.all(selected.map((s) => {
      return fetch('/api/pictures/' + s, {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json' }
      });
    })).then(() => {
      setSelected([]);
      props.getData && props.getData();
    });
  };
  const onQuickEntry = () => {
    setSelected([]);
    props.getData && props.getData();
  };
  const OtherActions = () => {
    if (selected.length === 0) return null;
    return <ButtonGroup>
                     <Button onClick={handlePhotoDelete}>Delete</Button>
                     <Button onClick={handleSameAsPrevious}>Same as previous</Button>
                     <Button to={'/new?date=' + moment(date).format('YYYY-MM-DD') + '&filename=' + selected} component={Link}>Add new entry</Button>
                     
                   </ButtonGroup>;
  };

  const handleSameAsPrevious = () => {
    handleEntryClick(null, lastEntry);
  };

  
  /*let zoomPhotos = <div/>;
  if (selected.length > 0) {
    zoomPhotos = <div className="large"><PhotoList onClick={handlePhotoClick} data={selected} selected={selected}/></div>;
  }*/

  return (
    <div className={selected.length > 0 ? 'hasSelected' : ''}>
      <BulkOperations entries={entries} selected={selectedEntries} onDone={props.onDone} onClear={clearSelection} onSelectAll={selectAll}/>
      <PhotoList scroll onDelete={handlePhotoDelete} onClick={handlePhotoClick} data={props.data.unlinkedPhotos} selected={selected} />
      <OtherActions selected={selected}/>
      <EntriesView entries={props.data.entries} onClick={handleEntryClick} selected={selectedEntries} />
      <QuickEntryForm selected={selected} date={props.date} onSubmit={onQuickEntry} photos={selected} />
      <SelectedInfo entries={entries} selected={selectedEntries} />
    </div>
  );

}
DayEntriesView.propTypes = {
    date: PropTypes.object,
    getData: PropTypes.func,
    onDone: PropTypes.func,
    data: PropTypes.object
};

export default function DayView() {
  const { dateParam, granularityParam } = useParams();
  const [ data, setData ] = useState({});
  const [ date, setDate ] = useState(dateParam ? moment(dateParam).toDate() : new Date());
  const [ granularity, setGranularity ] = useState(granularityParam || 'day');
  const formats = {'day': 'YYYY-MM-DD', 'month': 'YYYY-MM', 'year': 'YYYY'};
  useEffect(() => {
    if (!dateParam) { setGranularity('day'); }
    else if (dateParam.length == 7) { setGranularity('month'); }
    else if (dateParam.length == 4) { setGranularity('year'); }
    else { setGranularity('day'); }
  }, [dateParam]);
  const onChange = date => {
    setDate(date);
    history.push('/' + granularity + '/' + date.format(formats[granularity]));
  };
  const previous = () => {
    onChange(moment(date).subtract(1, granularity));
  };
  const next = () => { setDate(moment(date).add(1, granularity)); };
  useEffect(() => { getData(); }, [date, granularity]);
  const getData = async() => {
    return fetch('/api/date/' + moment(date).format(formats[granularity]))
      .then(res => res.json())
      .then(data => setData(data));
  };
  const chooseGranularity = (newGran) => {
    setGranularity(newGran);
    history.push('/' + newGran + '/' + moment(date).format(formats['day']));
  };
  const granularitySelector = ['day', 'month', 'year'].map((o) => {
    return <Button key={o} onClick={() => chooseGranularity(o)} name={o}>View by {o}</Button>;
  });
  return (
    <div>
      {granularitySelector}
      <div>
        <Button onClick={previous}>&laquo;</Button>
        <DatePicker value={date} onChange={onChange} format={formats[granularity]}/>
        <Button onClick={next}>&raquo;</Button>
      </div>
      <DayEntriesView date={date} data={data} getData={getData} onDone={getData} />
    </div>
  );
}
