import React, { useState, useEffect } from 'react';
import "react-datepicker/dist/react-datepicker.css";
import Grid from '@material-ui/core/Grid';
import { useParams } from "react-router-dom";
import EntriesView from '../components/EntriesView';

export default function ZIDList(props) {
  const { zids } = useParams();
  const [ entries, setEntries ] = useState([]);
  const fetchEntries = (id) => {
      id = id.replace(/[^-0-9,]/g, '');
      if (id) {
        fetch('/api/entries?zidre=' + id.replace(/,/g, '|')).then((res) => res.json())
          .then((data) => {
            let hash = data.reduce((prev, o) => { prev[o.ZIDString] = o; return prev; }, {});
            setEntries(zids.split(',').map((k) => hash[k]));
          });
      }
  };
  useEffect(() => { fetchEntries(zids); }, [zids]);
  return <EntriesView entries={entries} />;
}
