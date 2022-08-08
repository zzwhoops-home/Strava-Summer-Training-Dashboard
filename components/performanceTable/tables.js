import React, { useMemo } from 'react';
import { useTable } from 'react-table';
import { athleteColumns } from './columns';

export default function AthleteTable({ activities }) {
    const columns = useMemo(() => athleteColumns, []);

    const formattedActivities = activities.map((activity=value) => {
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
    });
    const memorizedActivities = useMemo(() => formattedActivities, []);

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
      } = useTable({ columns, data: memorizedActivities });

    return (
        <table {...getTableProps()}>
            <thead>
                {headerGroups.map((headerGroup) => (
                    <tr {...headerGroup.getHeaderGroupProps()}>
                        {headerGroup.headers.map((column) => (
                            <th {...column.getHeaderProps()}>
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
                                    <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                                )
                            })}
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}