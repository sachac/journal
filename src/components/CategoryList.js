import TextField from '@material-ui/core/TextField';
import React from 'react';
import MenuItem from '@material-ui/core/MenuItem';

export const categories = ['Uncategorized',
                           'Kaizen',
                           'Thoughts',
                           'Us',
                           'Consulting',
                           'Oops',
                           'Meta',
                           'Gross motor',
                           'Fine motor',
                           'Eating',
                           'Language',
                           'Self-care and independence',
                           'Social',
                           'Household',
                           'Field trip',
                           'Pretend',
                           'Music',
                           'Sensory',
                           'Cognition',
                           'Emotion',
                           'Art',
                           'World',
                           'Interests',
                           'Sleep',
                           'Other',
                           'Track',
                          ];
export const alphaCategories = categories.slice().sort();

export default function CategoryList(data) {
  return <TextField label="Category" select name='category' value={data.value || ''} onChange={data.onChange} onKeyPress={data.onKeyPress} style={{width: '100%'}}>
      <MenuItem/>
      {alphaCategories.map((c, key) => { return (
        <MenuItem value={c} key={key}>{c}</MenuItem>
      ); })}
    </TextField>;
}


