import React, { useMemo } from 'react';
import { useTable } from 'react-table';
import { athleteColumns } from './columns';
import styles from '../../styles/Athletes.module.css'

export default function AthleteTable({ activities }) {
    const columns = useMemo(() => athleteColumns, []);

    const formattedActivities = activities.map((activity=value) => {
        const performance = activity.activityPerformance;
        return ({
            activityId: activity.activityId,
            date: activity.startDateLocal,
            utcOffset: activity.utcOffset,
            title: activity.name,
            distance: Math.round(activity.distance * 0.0006214),
            elevGain: Math.round(activity.elevGain),
            timeRatio: Math.round(performance.MERatio * 1000) / 1000,
            kudos: activity.kudos,
            performance: Math.round(performance.totalPP * 100) / 100
        });
    });
    formattedActivities.sort((a, b) => a.performance < b.performance ? 1 : -1);
    const memorizedActivities = useMemo(() => formattedActivities, []);

    const defaultColumn = {
        width: "auto"
    }

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable({ columns, data: memorizedActivities, defaultColumn });

    return (
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
                {rows.map((row) => {
                    prepareRow(row);
                    
                    return (
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
                    );
                })}
            </tbody>
        </table>
    );
}