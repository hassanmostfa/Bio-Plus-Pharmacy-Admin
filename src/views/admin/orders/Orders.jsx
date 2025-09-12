import {
  Box,
  Flex,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Checkbox,
  Badge,
  Image,
  useToast,
} from '@chakra-ui/react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import React, { useState, useEffect } from 'react';
import Card from 'components/card/Card';
import { FaEye, FaFilePdf, FaFileExcel } from 'react-icons/fa';
import { IoMdPrint } from 'react-icons/io';
import { useNavigate } from 'react-router-dom';
import { useGetOrdersQuery, useUpdateOrderStatusMutation } from 'api/orderSlice';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useTranslation } from "react-i18next";
import i18n from "../../../i18n";

const columnHelper = createColumnHelper();

const Orders = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });
  
  // Filters state
  const [filters, setFilters] = useState({
    status: '',
    paymentMethod: '',
    startDate: '',
    endDate: '',
  });

  // Fetch orders with pagination and filters
  const { data: ordersResponse, isLoading, refetch } = useGetOrdersQuery({
    page: pagination.page,
    limit: pagination.limit,
    pharmacyId: JSON.parse(localStorage.getItem('pharmacy')).id,
    ...filters
  });

  // Update order status mutation
  const [updateOrderStatus, { isLoading: isUpdatingStatus }] = useUpdateOrderStatusMutation();

  const orders = ordersResponse?.data || [];
  const totalItems = ordersResponse?.pagination?.totalItems || 0;
  const totalPages = ordersResponse?.pagination?.totalPages || 1;

    // Trigger refetch when component mounts (navigates to)
    React.useEffect(() => {
      if (!isLoading) {
        refetch();
      }
    }, [refetch, isLoading]);

    
  // Format date for display
  const formatDate = (dateString) => {
    return dateString ? new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }) : 'N/A';
  };

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    // Reset to first page when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Apply filters (triggers automatic refetch)
  const applyFilters = () => {
    refetch();
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      status: '',
      paymentMethod: '',
      startDate: '',
      endDate: '',
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle status update
  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await updateOrderStatus({
        orderId: orderId,
        status: newStatus
      }).unwrap();
      
      // Refresh the orders list
      refetch();
      
      // Update the selected order in the modal if it's the same order
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
      
      toast({
        title: t('orders.statusUpdated'),
        description: t('orders.statusUpdatedMsg'),
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: t('orders.error'),
        description: error.data?.message || t('orders.statusUpdateFail'),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle checkbox change
  const handleCheckboxChange = (orderId) => {
    if (selectedOrders.includes(orderId)) {
      setSelectedOrders(selectedOrders.filter((id) => id !== orderId));
    } else {
      setSelectedOrders([...selectedOrders, orderId]);
    }
  };

  // Handle print selected orders
  const handlePrintSelectedOrders = () => {
    if (selectedOrders.length === 0) {
      toast({
        title: 'No orders selected',
        description: 'Please select at least one order to print',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const ordersToPrint = orders.filter((order) => selectedOrders.includes(order.id));
    
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write('<html><head><title>Print Orders</title></head><body>');
    printWindow.document.write('<h1>Selected Orders</h1>');
    printWindow.document.write('<table border="1" style="width:100%; border-collapse: collapse;">');
    printWindow.document.write(`
      <tr>
        <th>Order Number</th>
        <th>Date</th>
        <th>Customer</th>
        <th>Phone</th>
        <th>Pharmacy</th>
        <th>Status</th>
        <th>Payment</th>
        <th>Total</th>
      </tr>
    `);
  
    ordersToPrint.forEach((order) => {
      printWindow.document.write(`
        <tr>
          <td>${order.orderNumber}</td>
          <td>${formatDate(order.createdAt)}</td>
          <td>${order.user?.name || 'N/A'}</td>
          <td>${order.user?.phoneNumber || 'N/A'}</td>
          <td>${order.pharmacy?.name || 'N/A'}</td>
          <td>${order.status}</td>
          <td>${order.paymentMethod}</td>
          <td>${order.total}</td>
        </tr>
      `);
    });
  
    printWindow.document.write('</table></body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  // Handle PDF Export
  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text('Orders Report', 14, 15);
    
    // Add date range if filters are applied
    if (filters.startDate || filters.endDate) {
      doc.setFontSize(10);
      doc.text(`Date Range: ${filters.startDate || 'N/A'} to ${filters.endDate || 'N/A'}`, 14, 25);
    }

    // Prepare table data
    const tableData = orders.map(order => [
      order.orderNumber,
      formatDate(order.createdAt),
      order.user?.name || 'N/A',
      order.user?.phoneNumber || 'N/A',
      order.pharmacy?.name || 'N/A',
      order.status,
      order.paymentMethod,
      order.total
    ]);

    // Add table using autoTable
    autoTable(doc, {
      head: [['Order #', 'Date', 'Customer', 'Phone', 'Pharmacy', 'Status', 'Payment', 'Total']],
      body: tableData,
      startY: 30,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    // Save the PDF
    doc.save('orders-report.pdf');
  };

  // Handle Excel Export
  const handleExportExcel = () => {
    // Prepare data for Excel
    const excelData = orders.map(order => ({
      'Order #': order.orderNumber,
      'Date': formatDate(order.createdAt),
      'Customer': order.user?.name || 'N/A',
      'Phone': order.user?.phoneNumber || 'N/A',
      'Pharmacy': order.pharmacy?.name || 'N/A',
      'Status': order.status,
      'Payment': order.paymentMethod,
      'Total': order.total
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Orders');

    // Save the Excel file
    XLSX.writeFile(wb, 'orders-report.xlsx');
  };

  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');

  const { t } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // Move columns definition here, after t is initialized
  const columns = [
    columnHelper.accessor('id', {
      header: '',
      cell: (info) => (
        <Checkbox
          isChecked={selectedOrders.includes(info.getValue())}
          onChange={() => handleCheckboxChange(info.getValue())}
          colorScheme={'brandScheme'}
        />
      ),
    }),
    columnHelper.accessor('orderNumber', {
      header: t('orders.orderNumber'),
      cell: (info) => <Text color={textColor} fontWeight="bold">{info.getValue()}</Text>,
    }),
    columnHelper.accessor('createdAt', {
      header: t('orders.date'),
      cell: (info) => <Text color={textColor}>{formatDate(info.getValue())}</Text>,
    }),
    columnHelper.accessor('user.name', {
      header: t('orders.customer'),
      cell: (info) => <Text color={textColor}>{info.getValue() || 'N/A'}</Text>,
    }),
    columnHelper.accessor('user.phoneNumber', {
      header: t('orders.phone'),
      cell: (info) => <Text color={textColor}>{info.getValue() || 'N/A'}</Text>,
    }),
    columnHelper.accessor('pharmacy.name', {
      header: t('orders.pharmacy'),
      cell: (info) => <Text color={textColor}>{info.getValue() || 'N/A'}</Text>,
    }),
    columnHelper.accessor('status', {
      header: t('orders.status'),
      cell: (info) => (
        <Badge
          colorScheme={
            info.getValue() === 'PENDING' ? 'yellow' :
            info.getValue() === 'PROCESSING' ? 'blue' :
            info.getValue() === 'SHIPPED' ? 'purple' :
            info.getValue() === 'DELIVERED' ? 'green' : 'red'
          }
          px="10px"
          py="2px"
          borderRadius="8px"
        >
          {info.getValue()}
        </Badge>
      ),
    }),
    columnHelper.accessor('paymentMethod', {
      header: t('orders.payment'),
      cell: (info) => (
        <Badge
          colorScheme={info.getValue() === 'PAID' ? 'green' : 'orange'}
          px="10px"
          py="2px"
          borderRadius="8px"
        >
          {info.getValue()}
        </Badge>
      ),
    }),
    columnHelper.accessor('total', {
      header: t('orders.total'),
      cell: (info) => <Text color={textColor} fontWeight="bold">{info.getValue()}</Text>,
    }),
    columnHelper.accessor('actions', {
      header: t('orders.actions'),
      cell: (info) => (
        <Flex align="center" gap="10px">
          <Icon
            w="18px"
            h="18px"
            color="blue.500"
            as={FaEye}
            cursor="pointer"
            onClick={() => {
              setSelectedOrder(info.row.original);
              onOpen();
            }}
          />
          <Select
            size="xs"
            value=""
            onChange={(e) => {
              if (e.target.value) {
                handleStatusUpdate(info.row.original.id, e.target.value);
                e.target.value = ""; // Reset to default after selection
              }
            }}
            isDisabled={isUpdatingStatus}
            width="120px"
            fontSize="xs"
            placeholder="Update Status"
            _placeholder={{ color: "gray.500", fontSize: "xs" }}
          >
            <option value="PENDING">PENDING</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED">DELIVERED</option>
          </Select>
        </Flex>
      ),
    }),
  ];

  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Box dir={isRTL ? 'rtl' : 'ltr'} >
      <Card flexDirection="column" w="100%" px="0px" overflowX={{ sm: 'scroll', lg: 'hidden' }} mt={'100px'}>
        <Flex px="25px" mb="8px" justifyContent="space-between" align="center">
          <Text color={textColor} fontSize="22px" fontWeight="700">{t('orders.allOrders')}</Text>
          <Box display="flex" gap="10px">
            <Button
              variant="darkBrand"
              color="white"
              fontSize="sm"
              fontWeight="500"
              borderRadius="70px"
              px="24px"
              py="5px"
              onClick={handleExportPDF}
              leftIcon={<FaFilePdf />}
            >
              {t('orders.exportPDF')}
            </Button>
            <Button
              variant="darkBrand"
              color="white"
              fontSize="sm"
              fontWeight="500"
              borderRadius="70px"
              px="24px"
              py="5px"
              onClick={handleExportExcel}
              leftIcon={<FaFileExcel />}
            >
              {t('orders.exportExcel')}
            </Button>
            <Button
              variant="darkBrand"
              color="white"
              fontSize="sm"
              fontWeight="500"
              borderRadius="70px"
              px="24px"
              py="5px"
              width={'200px'}
              onClick={handlePrintSelectedOrders}
              leftIcon={<IoMdPrint />}
            >
              {t('orders.printSelected')}
            </Button>
            <Button
              variant="darkBrand"
              color="white"
              fontSize="sm"
              fontWeight="500"
              borderRadius="70px"
              px="24px"
              py="5px"
              width={'200px'}
              onClick={() => navigate('/admin/add-order')}
              leftIcon={<IoMdPrint />}
            >
              {t('Make Order')}
            </Button>
          </Box>
        </Flex>

        {/* Filters */}
        <Flex mb="20px" mx="10px" wrap="wrap" justifyContent="space-around" gap="10px">
          {/* Status Filter */}
          {/* <Box>
            <Select
              placeholder="Filter by Status"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              size="sm"
              borderRadius="15px"
              width="250px"
              bg={'gray.100'}
            >
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
          </Box> */}

          {/* Payment Method Filter */}
          {/* <Box>
            <Select
              placeholder="Filter by Payment"
              value={filters.paymentMethod}
              onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
              size="sm"
              borderRadius="15px"
              width="250px"
              bg={'gray.100'}
            >
              <option value="CASH_ON_DELIVERY">Cash on Delivery</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="PAYPAL">PayPal</option>
            </Select>
          </Box> */}
        </Flex>

        {/* Date Range Filter */}
        <Flex mb="20px" mx="20px" wrap="wrap" justifyContent="space-around" alignItems="center" gap="10px">
          <Box>
            <Text color={textColor} mb="10px" fontWeight="bold" fontSize="sm">{t('orders.fromDate')}</Text>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              size="sm"
              borderRadius="15px"
              padding="20px"
              bg={'gray.100'}
              width={'250px'}
            />
          </Box>
          <Box>
            <Text color={textColor} mb="10px" fontWeight="bold" fontSize="sm">{t('orders.toDate')}</Text>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              size="sm"
              borderRadius="15px"
              padding="20px"
              bg={'gray.100'}
              width={'250px'}
            />
          </Box>
          <Flex gap="10px" mt="20px">
            <Button
              onClick={applyFilters}
              variant="darkBrand"
              color="white"
              fontSize="sm"
              fontWeight="500"
              borderRadius="70px"
              px="24px"
              py="5px"
            >
              {t('orders.applyFilters')}
            </Button>
            <Button
              onClick={resetFilters}
              variant="outline"
              colorScheme="gray"
              fontSize="sm"
              fontWeight="500"
              borderRadius="70px"
              px="24px"
              py="5px"
            >
              {t('orders.resetFilters')}
            </Button>
          </Flex>
        </Flex>

        {/* Table */}
        <Box overflowX="auto">
          <Table variant="simple" color="gray.500" mb="24px" mt="12px" minWidth="1000px">
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
                            header.getContext()
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
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <Tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <Td key={cell.id} borderColor="transparent">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </Td>
                    ))}
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={columns.length} textAlign="center" py="40px">
                    <Text color={textColor}>{t('orders.noOrdersFound')}</Text>
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </Box>

        {/* Pagination */}
        <Flex justifyContent="space-between" alignItems="center" px="25px" py="10px">
          <Text color={textColor}>
            {t('orders.showing')} {orders.length} {t('orders.of')} {totalItems} {t('orders.orders')}
          </Text>
          <Flex gap="10px">
            <Button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              isDisabled={pagination.page === 1}
              variant="outline"
              size="sm"
            >
              {t('orders.previous')}
            </Button>
            <Text color={textColor} px="10px" display="flex" alignItems="center">
              {t('orders.page')} {pagination.page} {t('orders.of')} {totalPages}
            </Text>
            <Button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              isDisabled={pagination.page >= totalPages}
              variant="outline"
              size="sm"
            >
              {t('orders.next')}
            </Button>
          </Flex>
        </Flex>
      </Card>

      {/* Order Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('orders.orderDetails')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedOrder && (
              <Box>
                <Flex justifyContent="space-between" mb="20px">
                  <Box>
                    <Text fontSize="sm" color="gray.500">{t('orders.orderNumber')}</Text>
                    <Text fontWeight="bold">{selectedOrder.orderNumber}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">{t('orders.date')}</Text>
                    <Text>{formatDate(selectedOrder.createdAt)}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">{t('orders.status')}</Text>
                    <Flex align="center" gap="10px">
                      <Badge
                        colorScheme={
                          selectedOrder.status === 'PENDING' ? 'yellow' :
                          selectedOrder.status === 'PROCESSING' ? 'blue' :
                          selectedOrder.status === 'SHIPPED' ? 'purple' :
                          selectedOrder.status === 'DELIVERED' ? 'green' : 'red'
                        }
                        px="10px"
                        py="2px"
                        borderRadius="8px"
                      >
                        {selectedOrder.status}
                      </Badge>
                      <Select
                        size="sm"
                        value={selectedOrder.status}
                        onChange={(e) => handleStatusUpdate(selectedOrder.id, e.target.value)}
                        isDisabled={isUpdatingStatus}
                        width="150px"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="PROCESSING">PROCESSING</option>
                        <option value="SHIPPED">SHIPPED</option>
                        <option value="DELIVERED">DELIVERED</option>
                      </Select>
                    </Flex>
                  </Box>
                </Flex>

                <Flex justifyContent="space-between" mb="20px">
                  <Box>
                    <Text fontSize="sm" color="gray.500">{t('orders.customer')}</Text>
                    <Text>{selectedOrder.user?.name || 'N/A'}</Text>
                    <Text>{selectedOrder.user?.phoneNumber || 'N/A'}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">{t('orders.pharmacy')}</Text>
                    <Text>{selectedOrder.pharmacy?.name || 'N/A'}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">{t('orders.payment')}</Text>
                    <Text>{selectedOrder.paymentMethod}</Text>
                    <Badge
                      colorScheme={selectedOrder.paymentStatus === 'green' ? 'green' : 'orange'}
                      px="10px"
                      py="2px"
                      borderRadius="8px"
                    >
                      {selectedOrder.paymentStatus}
                    </Badge>
                  </Box>
                </Flex>

                <Box mb="20px">
                  <Text fontSize="sm" color="gray.500">{t('orders.address')}</Text>
                  {selectedOrder.address ? (
                    <Text>
                      {selectedOrder.address.buildingNo} {selectedOrder.address.street}, 
                      {selectedOrder.address.city}
                    </Text>
                  ) : (
                    <Text>N/A</Text>
                  )}
                </Box>

                <Box mb="20px">
                  <Text fontSize="lg" fontWeight="bold" mb="10px">{t('orders.items')}</Text>
                  {selectedOrder.items?.map((item) => (
                    <Flex key={item.id} mb="10px" p="10px" borderBottom="1px solid" borderColor="gray.200">
                      <Image
                        src={item.imageUrl}
                        boxSize="50px"
                        objectFit="cover"
                        mr="10px"
                        fallbackSrc="https://via.placeholder.com/50"
                      />
                      <Box flex="1">
                        <Text fontWeight="bold">{item.name}</Text>
                        <Text>Qty: {item.quantity}</Text>
                      </Box>
                      <Box textAlign="right">
                        <Text>kwd {item.price}</Text>
                        <Text>Subtotal: kwd {item.subtotal}</Text>
                      </Box>
                    </Flex>
                  ))}
                </Box>

                <Flex justifyContent="flex-end">
                  <Box textAlign="right">
                    <Text>Subtotal: kwd {selectedOrder.subtotal}</Text>
                    <Text>Delivery Fee: kwd {selectedOrder.deliveryFee}</Text>
                    <Text fontWeight="bold" fontSize="lg">Total: kwd {selectedOrder.total}</Text>
                  </Box>
                </Flex>
              </Box>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="darkBrand"
              color="white"
              fontSize="sm"
              fontWeight="500"
              borderRadius="70px"
              px="24px"
              py="5px"
              mr="10px"
              onClick={() => {
                const printWindow = window.open('', '', 'width=800,height=600');
                printWindow.document.write('<html><head><title>Order Details - ' + selectedOrder.orderNumber + '</title></head><body>');
                printWindow.document.write('<h1>Order Details</h1>');
                printWindow.document.write('<table border="1" style="width:100%; border-collapse: collapse; margin-bottom: 20px;">');
                printWindow.document.write(`
                  <tr>
                    <th style="padding: 8px; background-color: #f0f0f0;">Order Number</th>
                    <td style="padding: 8px;">${selectedOrder.orderNumber}</td>
                  </tr>
                  <tr>
                    <th style="padding: 8px; background-color: #f0f0f0;">Date</th>
                    <td style="padding: 8px;">${formatDate(selectedOrder.createdAt)}</td>
                  </tr>
                  <tr>
                    <th style="padding: 8px; background-color: #f0f0f0;">Status</th>
                    <td style="padding: 8px;">${selectedOrder.status}</td>
                  </tr>
                  <tr>
                    <th style="padding: 8px; background-color: #f0f0f0;">Customer</th>
                    <td style="padding: 8px;">${selectedOrder.user?.name || 'N/A'}</td>
                  </tr>
                  <tr>
                    <th style="padding: 8px; background-color: #f0f0f0;">Phone</th>
                    <td style="padding: 8px;">${selectedOrder.user?.phoneNumber || 'N/A'}</td>
                  </tr>
                  <tr>
                    <th style="padding: 8px; background-color: #f0f0f0;">Pharmacy</th>
                    <td style="padding: 8px;">${selectedOrder.pharmacy?.name || 'N/A'}</td>
                  </tr>
                  <tr>
                    <th style="padding: 8px; background-color: #f0f0f0;">Payment Method</th>
                    <td style="padding: 8px;">${selectedOrder.paymentMethod}</td>
                  </tr>
                  <tr>
                    <th style="padding: 8px; background-color: #f0f0f0;">Payment Status</th>
                    <td style="padding: 8px;">${selectedOrder.paymentStatus}</td>
                  </tr>
                `);
                printWindow.document.write('</table>');
                
                if (selectedOrder.address) {
                  printWindow.document.write('<h3>Delivery Address</h3>');
                  printWindow.document.write('<p>' + selectedOrder.address.buildingNo + ' ' + selectedOrder.address.street + ', ' + selectedOrder.address.city + '</p>');
                }
                
                printWindow.document.write('<h3>Order Items</h3>');
                printWindow.document.write('<table border="1" style="width:100%; border-collapse: collapse;">');
                printWindow.document.write(`
                  <tr style="background-color: #f0f0f0;">
                    <th style="padding: 8px;">Item</th>
                    <th style="padding: 8px;">Quantity</th>
                    <th style="padding: 8px;">Price</th>
                    <th style="padding: 8px;">Subtotal</th>
                  </tr>
                `);
                
                selectedOrder.items?.forEach((item) => {
                  printWindow.document.write(`
                    <tr>
                      <td style="padding: 8px;">${item.name}</td>
                      <td style="padding: 8px;">${item.quantity}</td>
                      <td style="padding: 8px;">kwd ${item.price}</td>
                      <td style="padding: 8px;">kwd ${item.subtotal}</td>
                    </tr>
                  `);
                });
                
                printWindow.document.write('</table>');
                printWindow.document.write('<div style="margin-top: 20px; text-align: right;">');
                printWindow.document.write('<p><strong>Subtotal: kwd ' + selectedOrder.subtotal + '</strong></p>');
                printWindow.document.write('<p><strong>Delivery Fee: kwd ' + selectedOrder.deliveryFee + '</strong></p>');
                printWindow.document.write('<p style="font-size: 18px;"><strong>Total: kwd ' + selectedOrder.total + '</strong></p>');
                printWindow.document.write('</div>');
                printWindow.document.write('</body></html>');
                printWindow.document.close();
                printWindow.print();
              }}
              leftIcon={<IoMdPrint />}
            >
              {t('orders.print')}
            </Button>
            <Button onClick={onClose}>{t('orders.close')}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Orders;