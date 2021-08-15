/*
 * @copyright EveryWorkflow. All rights reserved.
 */

import React, {useCallback, useContext, useState} from 'react';
import {Link, useHistory} from 'react-router-dom';
import Table from 'antd/lib/table';
import Menu from 'antd/lib/menu';
import Dropdown from 'antd/lib/dropdown';
import Button from 'antd/lib/button';
import DataGridContext from '@EveryWorkflow/DataGridBundle/Context/DataGridContext';
import FilterComponent from '@EveryWorkflow/DataGridBundle/Component/FilterComponent';
import HeaderPanelComponent from '@EveryWorkflow/DataGridBundle/Component/HeaderPanelComponent';
import {DATA_GRID_TYPE_INLINE} from '@EveryWorkflow/DataGridBundle/Component/DataGridComponent/DataGridComponent';
import ColumnConfigComponent from '@EveryWorkflow/DataGridBundle/Component/ColumnConfigComponent';
import {ACTION_SET_SELECTED_ROW_IDS} from '@EveryWorkflow/DataGridBundle/Reducer/DataGridReducer';
import EllipsisOutlined from '@ant-design/icons/EllipsisOutlined';

const TableComponent = () => {
    const {state: gridState, dispatch: gridDispatch} = useContext(DataGridContext);
    const [selectedRows, setSelectedRows] = useState<Array<any>>([]);
    const history = useHistory();
    const urlParams = new URLSearchParams(window.location.search);

    const getColumnData = useCallback(() => {
        const columnData: Array<any> = [];
        const sortField = urlParams.get('sort-field');
        let sortOrder = 'ascend';
        if (urlParams.get('sort-order') && urlParams.get('sort-order') === 'desc') {
            sortOrder = 'descend';
        }

        gridState.data_grid_column_state.forEach((col) => {
            const field = gridState.data_form?.fields.find(
                (item) => item.name === col.name
            );
            if (field) {
                columnData.push({
                    title: field.label,
                    dataIndex: field.name,
                    sorter: gridState.data_grid_config?.sortable_columns?.includes(field.name ?? ''),
                    // eslint-disable-next-line react/display-name
                    render: (value: any) => <span>{value}</span>,
                    sortOrder: field.name === sortField ? sortOrder : false,
                });
            }
        });
        if (columnData.length) {
            columnData.push({
                title: 'Action',
                key: 'operation',
                fixed: 'right',
                width: 100,
                // eslint-disable-next-line react/display-name
                render: (_: any, record: any) => (
                    <Dropdown
                        overlay={
                            <Menu>
                                {gridState.data_grid_config?.row_actions?.map(
                                    (action: any, index: number) => (
                                        <Menu.Item key={index}>
                                            <Link
                                                to={() => {
                                                    if (action.path) {
                                                        let path: string = action.path;
                                                        Object.keys(record).forEach((itemKey: string) => {
                                                            path = path.replace(
                                                                '{' + itemKey + '}',
                                                                record[itemKey]
                                                            );
                                                        });
                                                        return {pathname: path};
                                                    }
                                                    return '';
                                                }}
                                                target={action.button_target}
                                            >
                                                {action.label}
                                            </Link>
                                        </Menu.Item>
                                    )
                                )}
                            </Menu>
                        }
                        trigger={['click']}
                        placement="bottomRight"
                    >
                        <Button type="text" size="small">
                            <EllipsisOutlined/>
                        </Button>
                    </Dropdown>
                ),
            });
        }
        return columnData;
    }, [gridState]);

    const getDataSource = useCallback(() => {
        const data: Array<any> = [];
        gridState.data_collection?.results.forEach((item) => {
            const newItem: any = {
                key: item._id,
            };
            gridState.data_grid_column_state.forEach((col) => {
                if (col.name in item) {
                    newItem[col.name] = item[col.name];
                }
            });
            data.push(newItem);
        });
        return data;
    }, [gridState]);

    const getRowSelection = useCallback(() => {
        const onSelectChange = (selectedRowKeys: Array<any>) => {
            console.log('selectedRowKeys changed: ', selectedRowKeys);
            setSelectedRows(selectedRowKeys);
            gridDispatch({
                type: ACTION_SET_SELECTED_ROW_IDS,
                payload: selectedRowKeys,
            });
        };

        return {
            selectedRows,
            onChange: onSelectChange,
            selections: [
                Table.SELECTION_ALL,
                Table.SELECTION_INVERT,
                Table.SELECTION_NONE,
            ],
        };
    }, [selectedRows, gridDispatch]);

    const onTableChange = (pagination: any, filters: any, sorter: any) => {
        if (gridState.data_grid_url) {
            let newUrlPath = history.location.pathname;
            newUrlPath += '?page=' + pagination.current;
            if (pagination.pageSize && pagination.pageSize > 0 && pagination.pageSize !== 20) {
                newUrlPath += '&per-page=' + pagination.pageSize;
            }
            if (urlParams.get('filter')) {
                try {
                    newUrlPath += '&filter=' + JSON.stringify(JSON.parse(urlParams.get('filter') ?? '{}'));
                } catch (e) {
                    // ignore urlPramData is cannot parse as json
                }
            }
            if (sorter.field && sorter.order) {
                let sortOrder = 'asc';
                if (sorter.order === 'descend') {
                    sortOrder = 'desc';
                }
                newUrlPath += '&sort-field=' + sorter.field + '&sort-order=' + sortOrder;
            }
            history.push(newUrlPath);
        }
    }

    return (
        <>
            {gridState.data_grid_type === DATA_GRID_TYPE_INLINE && (
                <HeaderPanelComponent/>
            )}
            {gridState.data_collection && (
                <>
                    <FilterComponent/>
                    <Table
                        rowSelection={getRowSelection()}
                        dataSource={getDataSource()}
                        columns={getColumnData()}
                        pagination={{
                            defaultPageSize: Number(urlParams.get('per-page')) ? Number(urlParams.get('per-page')) : 20,
                            pageSizeOptions: ['20', '50', '100', '200'],
                            showQuickJumper: true,
                            hideOnSinglePage: true,
                            showTotal: (total, range) => {
                                return `Showing ${range[0]}-${range[1]} of ${total} items`;
                            },
                            current: gridState.data_collection.meta?.current_page,
                            total: gridState.data_collection.meta?.total_count,
                        }}
                        onChange={onTableChange}
                        // size={'small'}
                    />
                    <ColumnConfigComponent/>
                </>
            )}
        </>
    );
};

export default TableComponent;
