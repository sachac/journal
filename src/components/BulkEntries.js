import React from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableContainer from '@material-ui/core/TableContainer';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import PhotoList from './PhotoList';

function BulkEntryView(data) {
    var entry = data.entry;
    return (
            <TableRow>
                            <TableCell>{entry.Date}</TableCell>
            <TableCell><div><div data-id={entry.ID}>{entry.Note}</div><PhotoList data={entry.PictureList} /></div></TableCell>
            <TableCell>{entry.Category}</TableCell>
            </TableRow>
    );
}

function BulkEntries(data) {
    var entries = data.data;
    if (entries) {
        return (<TableContainer component={Paper}>
                <Table className="dateEntries">
                <TableBody>
                {entries.map((d) => {
                    return (<BulkEntryView entry={d} key={d.ID}/>);                    
                })}
                </TableBody></Table></TableContainer>);
    } else {
        return null;
    }
}

export default BulkEntries;
