import {
  Box,
  Button,
  Flex,
  Icon,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useToast,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Input,
  InputGroup,
  InputLeftElement,
  IconButton,
} from '@chakra-ui/react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  getFilteredRowModel,
} from '@tanstack/react-table';
import * as React from 'react';
import Card from 'components/card/Card';
import { EditIcon, SearchIcon } from '@chakra-ui/icons';
import { FaEye, FaTrash, FaDownload } from 'react-icons/fa6';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Pagination from "theme/components/Pagination";
import * as XLSX from 'xlsx';
import { useTranslation } from "react-i18next";
import { useContext } from 'react';
import { LanguageContext } from '../../../components/auth/LanguageContext';

const columnHelper = createColumnHelper();

const Reports = () => {
  const { t } = useTranslation();
  const { language } = useContext(LanguageContext);
  const [activeTab, setActiveTab] = React.useState(0);
  const [tableData, setTableData] = React.useState([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = React.useState('');
  const navigate = useNavigate();
  const [sorting, setSorting] = React.useState([]);
  const toast = useToast();

  // Pagination state for Inventory tab
  const [inventoryPage, setInventoryPage] = React.useState(1);
  const [inventoryLimit, setInventoryLimit] = React.useState(10);

  // Pagination state for Orders tab
  const [ordersPage, setOrdersPage] = React.useState(1);
  const [ordersLimit, setOrdersLimit] = React.useState(10);

  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');

  // Static mock data
  const inventoryData = {
    data: {
      products: [
        { name: 'Product A', category: 'Medicines', sku: 'SKU001', quantity: 150, stockStatus: 'In Stock', createdAt: '2024-01-15' },
        { name: 'Product B', category: 'Supplements', sku: 'SKU002', quantity: 25, stockStatus: 'Low Stock', createdAt: '2024-01-20' },
        { name: 'Product C', category: 'Devices', sku: 'SKU003', quantity: 0, stockStatus: 'Out of Stock', createdAt: '2024-01-25' },
        { name: 'Product D', category: 'Medicines', sku: 'SKU004', quantity: 200, stockStatus: 'In Stock', createdAt: '2024-02-01' },
        { name: 'Product E', category: 'Supplements', sku: 'SKU005', quantity: 30, stockStatus: 'Low Stock', createdAt: '2024-02-05' },
      ],
      pagination: {
        totalPages: 3,
        currentPage: 1,
        totalItems: 25
      }
    }
  };

  const ordersData = {
    data: {
      orders: [
        { orderNumber: 'ORD001', customerName: 'John Doe', total: 150.00, status: 'Completed', createdAt: '2024-01-15' },
        { orderNumber: 'ORD002', customerName: 'Jane Smith', total: 89.50, status: 'Pending', createdAt: '2024-01-20' },
        { orderNumber: 'ORD003', customerName: 'Mike Johnson', total: 245.75, status: 'Processing', createdAt: '2024-01-25' },
        { orderNumber: 'ORD004', customerName: 'Sarah Wilson', total: 67.25, status: 'Completed', createdAt: '2024-02-01' },
        { orderNumber: 'ORD005', customerName: 'David Brown', total: 189.99, status: 'Cancelled', createdAt: '2024-02-05' },
      ],
      pagination: {
        totalPages: 2,
        currentPage: 1,
        totalItems: 20
      }
    }
  };

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
             // Reset to first page when searching
       setInventoryPage(1);
       setOrdersPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Update table data when tab changes
  React.useEffect(() => {
    let newData = [];
         switch(activeTab) {
       case 0:
         newData = inventoryData?.data?.products || [];
         break;
       case 1:
         newData = ordersData?.data?.orders || [];
         break;
       default:
         break;
     }
    
    // Filter data based on search query
    if (debouncedSearchQuery) {
      newData = newData.filter(item => 
        Object.values(item).some(value => 
          value.toString().toLowerCase().includes(debouncedSearchQuery.toLowerCase())
        )
      );
    }
    
    setTableData(newData);
  }, [activeTab, debouncedSearchQuery]);

  const handleDownload = () => {
    const workbook = XLSX.utils.book_new();
    let fileName = 'report_data.xlsx';
    let sheetData = [];
    let sheetName = '';

         switch (activeTab) {
       case 0: // Inventory Tab
         sheetData = inventoryData?.data?.products?.map(item => ({
           'Product Name': item.name,
           'Category': item.category,
           'SKU': item.sku,
           'Quantity': item.quantity,
           'Stock Status': item.stockStatus,
           'Created At': item.createdAt,
         })) || [];
         sheetName = 'Inventory Report';
         fileName = 'inventory_report.xlsx';
         break;
       case 1: // Orders Tab
         sheetData = ordersData?.data?.orders?.map(item => ({
           'Order Number': item.orderNumber,
           'Customer Name': item.customerName,
           'Total': item.total,
           'Status': item.status,
           'Created At': item.createdAt,
         })) || [];
         sheetName = 'Orders Report';
         fileName = 'orders_report.xlsx';
         break;
       default:
         toast({
           title: 'Export Error',
           description: 'Could not determine report type',
           status: 'error',
           duration: 3000,
           isClosable: true,
         });
         return;
     }

    if (sheetData.length === 0) {
      toast({
        title: 'No Data to Export',
        description: `No data available for ${sheetName}`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    XLSX.writeFile(workbook, fileName);

    toast({
      title: 'Download Started',
      description: `Downloading ${sheetName} as Excel`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const inventoryColumns = [
    columnHelper.accessor('name', {
      id: 'name',
      header: () => (
        <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
          Product Name
        </Text>
      ),
      cell: (info) => (
        <Text color={textColor} fontSize="sm">
          {info.getValue()}
        </Text>
      ),
    }),
    columnHelper.accessor('category', {
      id: 'category',
      header: () => (
        <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
          Category
        </Text>
      ),
      cell: (info) => (
        <Text color={textColor} fontSize="sm">
          {info.getValue()}
        </Text>
      ),
    }),
    columnHelper.accessor('sku', {
      id: 'sku',
      header: () => (
        <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
          SKU
        </Text>
      ),
      cell: (info) => (
        <Text color={textColor} fontSize="sm">
          {info.getValue()}
        </Text>
      ),
    }),
    columnHelper.accessor('quantity', {
      id: 'quantity',
      header: () => (
        <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
          Quantity
        </Text>
      ),
      cell: (info) => (
        <Text color={textColor} fontSize="sm">
          {info.getValue()}
        </Text>
      ),
    }),
    columnHelper.accessor('stockStatus', {
      id: 'stockStatus',
      header: () => (
        <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
          Status
        </Text>
      ),
      cell: (info) => (
        <Text 
          color={info.getValue() === 'In Stock' ? 'green.500' : 
                info.getValue() === 'Low Stock' ? 'orange.500' : 'red.500'} 
          fontSize="sm"
        >
          {info.getValue()}
        </Text>
      ),
    }),
  ];

  const ordersColumns = [
    columnHelper.accessor('orderNumber', {
      id: 'orderNumber',
      header: () => (
        <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
          Order Number
        </Text>
      ),
      cell: (info) => (
        <Text color={textColor} fontSize="sm">
          {info.getValue()}
        </Text>
      ),
    }),
    columnHelper.accessor('customerName', {
      id: 'customerName',
      header: () => (
        <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
          Customer Name
        </Text>
      ),
      cell: (info) => (
        <Text color={textColor} fontSize="sm">
          {info.getValue()}
        </Text>
      ),
    }),
    columnHelper.accessor('total', {
      id: 'total',
      header: () => (
        <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
          Total
        </Text>
      ),
      cell: (info) => (
        <Text color={textColor} fontSize="sm">
          ${info.getValue()}
        </Text>
      ),
    }),
    columnHelper.accessor('status', {
      id: 'status',
      header: () => (
        <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
          Status
        </Text>
      ),
      cell: (info) => (
        <Text 
          color={info.getValue() === 'Completed' ? 'green.500' : 
                info.getValue() === 'Pending' ? 'orange.500' : 
                info.getValue() === 'Processing' ? 'blue.500' : 'red.500'} 
          fontSize="sm"
        >
          {info.getValue()}
        </Text>
      ),
    }),
    columnHelper.accessor('createdAt', {
      id: 'createdAt',
      header: () => (
        <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
          Created At
        </Text>
      ),
      cell: (info) => (
        <Text color={textColor} fontSize="sm">
          {info.getValue()}
        </Text>
      ),
    }),
  ];

  const getColumns = () => {
    switch(activeTab) {
      case 0: return inventoryColumns;
      case 1: return ordersColumns;
      default: return inventoryColumns;
    }
  };

  const table = useReactTable({
    data: tableData,
    columns: getColumns(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Box className="container" >
      <Card
        flexDirection="column"
        w="100%"
        px="0px"
        overflowX={{ sm: 'scroll', lg: 'hidden' }}
      >
        <Flex px="25px" mb="8px" justifyContent="space-between" align="center">
          <Text
            color={textColor}
            fontSize="22px"
            fontWeight="700"
            lineHeight="100%"
          >
            Reports
          </Text>
          <IconButton
            aria-label="Download All Reports"
            icon={<FaDownload />}
            colorScheme="green"
            variant="outline"
            onClick={handleDownload}
          />
        </Flex>

        <Tabs variant="soft-rounded" my={"20px"} colorScheme="brand" onChange={(index) => setActiveTab(index)}>
          <TabList px="25px">
            <Tab>Inventory</Tab>
            <Tab>Orders</Tab>
          </TabList>

          <Flex px="25px" my="20px">
            <InputGroup maxW="400px">
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.300" />
              </InputLeftElement>
              <Input
                borderRadius={"20px"}
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
                pl="30px"
                pr="30px"
              />
            </InputGroup>
          </Flex>

          <TabPanels>
            <TabPanel>
              <Table variant="simple" color="gray.500" mb="24px" mt="12px">
                <Thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <Tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <Th
                            key={header.id}
                            colSpan={header.colSpan}
                            pe="10px"
                            borderColor={borderColor}
                            cursor="pointer"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <Flex
                              justifyContent="space-between"
                              align="center"
                              fontSize={{ sm: '10px', lg: '12px' }}
                              color="gray.400"
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                              {{
                                asc: ' 🔼',
                                desc: ' 🔽',
                              }[header.column.getIsSorted()] ?? null}
                            </Flex>
                          </Th>
                        );
                      })}
                    </Tr>
                  ))}
                </Thead>
                <Tbody>
                  {table.getRowModel().rows.map((row) => (
                    <Tr key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <Td
                          key={cell.id}
                          fontSize={{ sm: '14px' }}
                          minW={{ sm: '150px', md: '200px', lg: 'auto' }}
                          borderColor="transparent"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </Td>
                      ))}
                    </Tr>
                  ))}
                </Tbody>
              </Table>

              {/* Pagination for Inventory tab */}
              {inventoryData?.data?.pagination?.totalPages > 1 && (
                <Flex justifyContent="center" mt={4} pb={4}>
                  <Pagination
                    currentPage={inventoryPage}
                    totalPages={inventoryData.data.pagination.totalPages}
                    onPageChange={setInventoryPage}
                  />
                </Flex>
              )}
                         </TabPanel>
             <TabPanel>
               <Table variant="simple" color="gray.500" mb="24px" mt="12px">
                 <Thead>
                   {table.getHeaderGroups().map((headerGroup) => (
                     <Tr key={headerGroup.id}>
                       {headerGroup.headers.map((header) => {
                         return (
                           <Th
                             key={header.id}
                             colSpan={header.colSpan}
                             pe="10px"
                             borderColor={borderColor}
                             cursor="pointer"
                             onClick={header.column.getToggleSortingHandler()}
                           >
                             <Flex
                               justifyContent="space-between"
                               align="center"
                               fontSize={{ sm: '10px', lg: '12px' }}
                               color="gray.400"
                             >
                               {flexRender(
                                 header.column.columnDef.header,
                                 header.getContext(),
                               )}
                               {{
                                 asc: ' 🔼',
                                 desc: ' 🔽',
                               }[header.column.getIsSorted()] ?? null}
                             </Flex>
                           </Th>
                         );
                       })}
                     </Tr>
                   ))}
                 </Thead>
                 <Tbody>
                   {table.getRowModel().rows.map((row) => (
                     <Tr key={row.id}>
                       {row.getVisibleCells().map((cell) => (
                         <Td
                           key={cell.id}
                           fontSize={{ sm: '14px' }}
                           minW={{ sm: '150px', md: '200px', lg: 'auto' }}
                           borderColor="transparent"
                         >
                           {flexRender(
                             cell.column.columnDef.cell,
                             cell.getContext(),
                           )}
                         </Td>
                       ))}
                     </Tr>
                   ))}
                 </Tbody>
               </Table>

               {/* Pagination for Orders tab */}
               {ordersData?.data?.pagination?.totalPages > 1 && (
                 <Flex justifyContent="center" mt={4} pb={4}>
                   <Pagination
                     currentPage={ordersPage}
                     totalPages={ordersData.data.pagination.totalPages}
                     onPageChange={setOrdersPage}
                   />
                 </Flex>
               )}
             </TabPanel>
          </TabPanels>
        </Tabs>
      </Card>
    </Box>
  );
};

export default Reports;
