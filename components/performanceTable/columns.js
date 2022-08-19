import styles from '../../styles/PerformanceTable.module.css'

export const athleteColumns = [
    {
        Header: 'Date',
        accessor: 'date',
        width: '200px',
        Cell: ({ value }) => {
            const options = {
                "month": "numeric",
                "day": "numeric",
                "year": "2-digit"
            }

            const date = (new Date(value)).toLocaleDateString("en-US", options);
            const days = Math.floor((Date.now() - Date.parse(value)) / (1000 * 60 * 60 * 24));
            return (
                <>
                    <div className={styles.dateColumn}>
                        <div className={styles.date}>{date}</div>
                        <div className={styles.timeAgo}>({days}d ago)</div>
                    </div>
                </>
            );
        }
    },
    {
        Header: 'Title',
        accessor: 'title',
        width: '400px',
        Cell: ({ row }) => {
            const activity = row.original;
            const link = `https://www.strava.com/activities/${activity.activityId}`;
            
            return (
                <div className={styles.title}>
                    <a href={link}>
                        {activity.title}
                    </a>
                </div>
            );
        }
    },
    {
        Header: 'Performance',
        accessor: 'performance',
        width: '250px',
        Cell: ({ row }) => {
            const activity = row.original;
            const performance = activity.performance;

            const weighted = performance * Math.pow(0.95, row.index);
            return (
                <>
                    <div className={styles.performanceColumn}>
                        <div>{Math.round(performance)}pp ({Math.round(weighted)}pp)</div>
                    </div>
                </>
            );
        }
    }
]