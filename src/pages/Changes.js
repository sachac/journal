import React, { useState, useEffect } from 'react';
import DeleteIcon from '@material-ui/icons/Delete';
import IconButton from '@material-ui/core/IconButton';

export default function Settings() {
    const [ data, setData ] = useState([]);
    const updateData = () => {
        fetch('/api/changes')
            .then(res => res.json())
            .then(data => setData(data));
    }
    useEffect(() => { updateData(); }, []);
    const deleteChange = (event, id) => {
        console.log(event.target, id);
        fetch('/api/changes/' + id, {method: 'DELETE', headers: {'Content-Type': 'application/json' }})
            .then(res => res.json())
            .then(data => setData(data));
    }
    return (
            <table>
            <tbody>
            {data.map((d) => {
                return (
                        <tr key={d.ID}>
                        <td><IconButton data-change-id={d.ID} onClick={(e) => { deleteChange(e, d.ID) }}><DeleteIcon/></IconButton></td>
                        <td>{d.Status}</td>
                        <td>{d.Date}</td>
                        <td>{d.Category}</td>
                        <td>{d.Pictures}</td>
                        <td>{d.Note}</td>
                        </tr>
                );
            })}
            </tbody>
            </table>
    );
}
