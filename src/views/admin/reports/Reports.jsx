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
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Badge,
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
import { useGetPharmacyReportQuery } from 'api/pharmacySlice'; // Update this path

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

  // Get pharmacy ID from localStorage
  const getPharmacyId = () => {
    try {
      const pharmacyData = localStorage.getItem('pharmacy');
      if (pharmacyData) {
        const pharmacy = JSON.parse(pharmacyData);
        return pharmacy.id;
      }
    } catch (error) {
      console.error('Error parsing pharmacy data from localStorage:', error);
    }
    return null;
  };

  const pharmacyId = getPharmacyId();

  // Use the pharmacy report API
  const { data: reportData, error, isLoading, refetch } = useGetPharmacyReportQuery(pharmacyId, {
    skip: !pharmacyId, // Skip the query if pharmacyId is not available
  });

  // Pagination state for Inventory tab
  const [inventoryPage, setInventoryPage] = React.useState(1);
  const [inventoryLimit] = React.useState(10);

  // Pagination state for Orders tab
  const [ordersPage, setOrdersPage] = React.useState(1);
  const [ordersLimit] = React.useState(10);

  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');

  // Process data from API
  const inventoryStats = reportData?.data?.inventoryStats || {};
  const orderStats = reportData?.data?.orderStats || {};
  const recentOrders = reportData?.data?.recentOrders || [];
  const lowStockProducts = inventoryStats?.lowStockProducts || [];
  const highStockProducts = inventoryStats?.highStockProducts || [];

  // Get pharmacy name from localStorage
  const getPharmacyName = () => {
    try {
      const pharmacyData = localStorage.getItem('pharmacy');
      if (pharmacyData) {
        const pharmacy = JSON.parse(pharmacyData);
        return pharmacy.name;
      }
    } catch (error) {
      console.error('Error parsing pharmacy data from localStorage:', error);
    }
    return 'Pharmacy';
  };

  const pharmacyName = getPharmacyName();

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

  // Update table data when tab changes or API data loads
  React.useEffect(() => {
    let newData = [];
    switch(activeTab) {
      case 0: // Inventory Tab - Low Stock Products
        newData = lowStockProducts;
        break;
      case 1: // Orders Tab - Recent Orders
        newData = recentOrders;
        break;
      default:
        break;
    }
    
    // Filter data based on search query
    if (debouncedSearchQuery) {
      newData = newData.filter(item => 
        Object.values(item).some(value => 
          value && value.toString().toLowerCase().includes(debouncedSearchQuery.toLowerCase())
        )
      );
    }
    
    setTableData(newData);
  }, [activeTab, debouncedSearchQuery, lowStockProducts, recentOrders]);

  const handleDownload = () => {
    const workbook = XLSX.utils.book_new();
    let fileName = 'pharmacy_report.xlsx';
    let sheetData = [];
    let sheetName = '';

    switch (activeTab) {
      case 0: // Inventory Tab
        sheetData = lowStockProducts.map(item => ({
          'Product Name': item.name,
          'SKU': item.sku,
          'Price': item.price,
          'Quantity': item.quantity,
          'Category': item.categoryName,
        }));
        sheetName = 'Low Stock Products';
        fileName = 'low_stock_products.xlsx';
        break;
      case 1: // Orders Tab
        sheetData = recentOrders.map(item => ({
          'Order Number': item.orderNumber,
          'Customer Name': item.customer?.name || 'N/A',
          'Phone Number': item.customer?.phoneNumber || 'N/A',
          'Total': item.total,
          'Status': item.status,
          'Payment Status': item.paymentStatus,
          'Created At': item.createdAt,
          'Item Count': item.itemCount,
        }));
        sheetName = 'Recent Orders';
        fileName = 'recent_orders.xlsx';
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
        <Text color={textColor} fontSize="sm" fontWeight="500">
          {info.getValue()}
        </Text>
      ),
    }),
    columnHelper.accessor('categoryName', {
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
    columnHelper.accessor('price', {
      id: 'price',
      header: () => (
        <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
          Price
        </Text>
      ),
      cell: (info) => (
        <Text color={textColor} fontSize="sm">
          ${info.getValue()}
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
        <Text 
          color={info.getValue() > 10 ? 'green.500' : 
                info.getValue() > 5 ? 'orange.500' : 'red.500'} 
          fontSize="sm"
          fontWeight="600"
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
        <Text color={textColor} fontSize="sm" fontWeight="500">
          {info.getValue()}
        </Text>
      ),
    }),
    columnHelper.accessor('customer.name', {
      id: 'customerName',
      header: () => (
        <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
          Customer Name
        </Text>
      ),
      cell: (info) => (
        <Text color={textColor} fontSize="sm">
          {info.getValue() || 'N/A'}
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
        <Text color={textColor} fontSize="sm" fontWeight="600">
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
      cell: (info) => {
        const status = info.getValue();
        let colorScheme;
        
        switch(status) {
          case 'COMPLETED': colorScheme = 'green'; break;
          case 'PENDING': colorScheme = 'orange'; break;
          case 'PROCESSING': colorScheme = 'blue'; break;
          case 'CANCELLED': colorScheme = 'red'; break;
          default: colorScheme = 'gray';
        }
        
        return (
          <Badge colorScheme={colorScheme} fontSize="sm">
            {status}
          </Badge>
        );
      },
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
          {new Date(info.getValue()).toLocaleDateString()}
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

  // Show error if no pharmacy ID
  if (!pharmacyId) {
    return (
      <Box className="container" display="flex" justifyContent="center" alignItems="center" minH="400px" flexDirection="column">
        <Text color="red.500" fontSize="lg" mb={4}>
          Pharmacy information not found. Please select a pharmacy first.
        </Text>
        <Button colorScheme="blue" onClick={() => navigate('/admin/pharmacies')}>
          Go to Pharmacies
        </Button>
      </Box>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <Box className="container" display="flex" justifyContent="center" alignItems="center" minH="400px">
        <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box className="container" display="flex" justifyContent="center" alignItems="center" minH="400px" flexDirection="column">
        <Text color="red.500" fontSize="lg" mb={4}>
          Error loading pharmacy report: {error.message || 'Unknown error'}
        </Text>
        <Button colorScheme="blue" onClick={refetch}>Retry</Button>
      </Box>
    );
  }

  return (
    <Box className="container">
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
            {pharmacyName} Analytics Report
          </Text>
          <IconButton
            aria-label="Download All Reports"
            icon={<FaDownload />}
            colorScheme="green"
            variant="outline"
            onClick={handleDownload}
          />
        </Flex>

        {/* Summary Stats */}
        <Grid templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(3, 1fr)' }} gap={6} px="25px" mb="25px">
          <GridItem>
            <Card p={4}>
              <Stat>
                <StatLabel>Total Orders</StatLabel>
                <StatNumber>{orderStats.totalOrders || 0}</StatNumber>
                <StatHelpText>
                  {orderStats.completedOrders || 0} Completed
                </StatHelpText>
              </Stat>
            </Card>
          </GridItem>
          <GridItem>
            <Card p={4}>
              <Stat>
                <StatLabel>Total Revenue</StatLabel>
                <StatNumber>${orderStats.totalRevenue || 0}</StatNumber>
                <StatHelpText>
                  Avg Order: ${orderStats.averageOrderValue || 0}
                </StatHelpText>
              </Stat>
            </Card>
          </GridItem>
          <GridItem>
            <Card p={4}>
              <Stat>
                <StatLabel>Inventory Status</StatLabel>
                <StatNumber>{inventoryStats.lowStockCount || 0} Low Stock</StatNumber>
                <StatHelpText>
                  {inventoryStats.highStockCount || 0} Well Stocked
                </StatHelpText>
              </Stat>
            </Card>
          </GridItem>
        </Grid>

        <Tabs variant="soft-rounded" my={"20px"} colorScheme="brand" onChange={(index) => setActiveTab(index)}>
          <TabList px="25px">
            <Tab>Low Stock Inventory ({lowStockProducts.length})</Tab>
            <Tab>Recent Orders ({recentOrders.length})</Tab>
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
              {lowStockProducts.length === 0 ? (
                <Text textAlign="center" py={10} color="gray.500">
                  No low stock products found
                </Text>
              ) : (
                <>
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
                  {lowStockProducts.length > inventoryLimit && (
                    <Flex justifyContent="center" mt={4} pb={4}>
                      <Pagination
                        currentPage={inventoryPage}
                        totalPages={Math.ceil(lowStockProducts.length / inventoryLimit)}
                        onPageChange={setInventoryPage}
                      />
                    </Flex>
                  )}
                </>
              )}
            </TabPanel>
            <TabPanel>
              {recentOrders.length === 0 ? (
                <Text textAlign="center" py={10} color="gray.500">
                  No recent orders found
                </Text>
              ) : (
                <>
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
                  {recentOrders.length > ordersLimit && (
                    <Flex justifyContent="center" mt={4} pb={4}>
                      <Pagination
                        currentPage={ordersPage}
                        totalPages={Math.ceil(recentOrders.length / ordersLimit)}
                        onPageChange={setOrdersPage}
                      />
                    </Flex>
                  )}
                </>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Card>
    </Box>
  );
};

export default Reports;