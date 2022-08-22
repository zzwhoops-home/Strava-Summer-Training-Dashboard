import React, { useMemo, useState } from 'react';
import { usePagination, useTable } from 'react-table';
import { athleteColumns } from './columns';
import styles from '../../styles/Athletes.module.css'

export default function AthleteTable({ activities }) {
    const columns = useMemo(() => athleteColumns, []);

    const formattedActivities = useMemo(() => activities.map((activity=value) => {
        const performance = activity.activityPerformance;
        return ({
            activityId: activity.activityId,
            date: activity.startDateLocal,
            utcOffset: activity.utcOffset,
            title: activity.name,
            distance: activity.distance,
            elevGain: activity.elevGain,
            timeRatio: performance.MERatio,
            kudos: activity.kudos,
            performance: performance.totalPP
        });
    }), []);
    const sortedActivities = useMemo(() => (formattedActivities.sort((a, b) => a.performance < b.performance ? 1 : -1)).slice(0, 33), []);

    const defaultColumn = {
        width: "auto"
    }

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        page,
        prepareRow,
        state: { pageSize },
        setPageSize
    } = useTable (
        { 
            columns,
            data: sortedActivities,
            defaultColumn,
            initialState: { pageSize: 5 }
        },
        usePagination
    );

    const [ expanded, setExpanded ] = useState(false);
    const [ expandText, setExpandText ] = useState("Show more");
    const toggleExpand = () => {
        if (expanded) {
            setPageSize(33);
            setExpandText("Show less");
        } else {
            setPageSize(5);
            setExpandText("Show more");
        }
        setExpanded(!expanded);
    }

    return (
        <>
            <table className={styles.performanceBorder} {...getTableProps()}>
                <thead>
                    {headerGroups.map((headerGroup) => (
                        <tr {...headerGroup.getHeaderGroupProps()}>
                            {headerGroup.headers.map((column) => (
                                <th className={`${styles.performanceHeaderCell}`} {...column.getHeaderProps({
                                    style: { width: column.width }
                                })}>
                                    {column.render("Header")}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody {...getTableBodyProps()}>
                    {page.map((row) => {
                        prepareRow(row);
                        
                        return (
                            <>
                                <tr {...row.getRowProps()}>
                                    {row.cells.map((cell) => {
                                        return (
                                            <td className={styles.performanceCell} {...cell.getCellProps({
                                                style: { width: cell.width }
                                            })}>
                                                {cell.render('Cell')}
                                            </td>
                                        )
                                    })}
                                </tr>
                            </>
                        );
                    })}
                </tbody>
            </table>
            <div className={styles.expand}>
                <a className={styles.expandButton} onClick={() => toggleExpand()} href="#performances">
                    <div>
                        <div>{expandText}</div>
                    </div>
                </a>
            </div>
        </>
    );
}