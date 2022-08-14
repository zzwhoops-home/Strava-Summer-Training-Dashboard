export const athleteColumns = [
    {
        Header: 'Date',
        accessor: 'date',
        width: '200px'
    },
    {
        Header: 'Title',
        accessor: 'title',
        width: '250px'
    },
    {
        Header: 'Distance',
        accessor: 'distance',
        width: '100px',
        Cell: ({ value }) => {
            return (<div>{Math.round(value * 0.06214) / 100}mi</div>)
        }
    },
    {
        Header: 'Elevation Gain',
        accessor: 'elevGain',
        width: '100px'
    },
    {
        Header: 'Kudos',
        accessor: 'kudos',
        width: '25px'
    },
    {
        Header: 'Performance',
        accessor: 'performance',
        width: '175px',
        Cell: ({ value, row }) => {
            const weighted = value * Math.pow(0.95, row.index);
            return (
                <>
                    <div>{Math.round(value)}pp ({Math.round(weighted)}pp)</div>
                </>
            );
        }
    }
]