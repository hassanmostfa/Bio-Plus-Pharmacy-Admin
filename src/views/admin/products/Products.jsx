import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
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
  Switch,
  Button,
  useToast,
  Skeleton,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Card
} from "@chakra-ui/react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { FaEye, FaTrash, FaFileExport, FaFileImport, FaDownload, FaUpload } from "react-icons/fa6";
import { EditIcon, PlusSquareIcon, ChevronDownIcon } from "@chakra-ui/icons";
import {FaSearch} from 'react-icons/fa';
import { useNavigate } from "react-router-dom";
import { useGetProductsQuery, useDeleteProductMutation, useUpdateProductMutation } from "api/productSlice";
import Swal from "sweetalert2";
import Pagination from "theme/components/Pagination";
import * as XLSX from 'xlsx';
import { useTranslation } from "react-i18next";
import i18n from "../../../i18n";

const columnHelper = createColumnHelper();

const Products = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  // Debounce search term to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1); // Reset to first page when searching
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: productsResponse, isLoading, isFetching, refetch } = useGetProductsQuery({ 
    page, 
    limit,
    search: debouncedSearchTerm, // Add search parameter
    pharmacyId: JSON.parse(localStorage.getItem('pharmacy')).id 
  });
  
  const [deleteProduct] = useDeleteProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");

  // Extract products and pagination data from response
  const products = productsResponse?.data || [];
  const pagination = productsResponse?.pagination || {
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1
  };

  // Trigger refetch when component mounts (navigates to)
  React.useEffect(() => {
    if (!isLoading) {
      refetch();
    }
  }, [refetch, isLoading]);

  const toggleStatus = async (productId, currentStatus) => {
    try {
      await updateProduct({
        id: productId,
        data: { isActive: !currentStatus }
      }).unwrap();
      refetch();
      toast({
        title: "Success",
        description: "Product status updated successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err.data?.message || "Failed to update product status",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const togglePublish = async (productId, currentPublished) => {
    try {
      await updateProduct({
        id: productId,
        data: { isPublished: !currentPublished }
      }).unwrap();
      refetch();
      toast({
        title: "Success",
        description: "Product publish status updated successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err.data?.message || "Failed to update product publish status",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDelete = async (productId) => {
    Swal.fire({
      title: t('products.areYouSure'),
      text: t('products.irreversible'),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: t('products.yesDelete')
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteProduct(productId).unwrap();
          refetch();
          toast({
            title: t('products.deleted'),
            description: t('products.deletedMsg'),
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        } catch (err) {
          toast({
            title: t('products.error'),
            description: err.data?.message || t('products.deleteFail'),
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      }
    });
  };

  // Export to Excel function
  const exportToExcel = () => {
    const data = products.map(product => ({
      Name: product.name,
      Category: product.categoryName,
      Price: product.price,
      Stock: product.quantity,
      Status: product.isActive ? 'Active' : 'Inactive',
      Published: product.isPublished ? 'Yes' : 'No'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
    XLSX.writeFile(workbook, "Products.xlsx");
    
    toast({
      title: t('products.exportSuccess'),
      description: t('products.exportMsg'),
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  // Import from Excel function
  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      // Here you would typically send the data to your API
      console.log("Imported data:", jsonData);
      
      toast({
        title: t('products.importSuccess'),
        description: t('products.importMsg', { count: jsonData.length }),
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    };
    reader.readAsArrayBuffer(file);
  };

  // Handle page change
  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
  }, []);

  // Determine if RTL
  const isRTL = i18n.language === 'ar';

  const columns = [
    columnHelper.accessor("name", {
      id: "name",
      header: () => <Text color="gray.400">{t('products.productName')}</Text>,
      cell: (info) => <Text color={textColor}>{info.getValue()}</Text>,
    }),
    columnHelper.accessor("categoryName", {
      id: "category",
      header: () => <Text color="gray.400">{t('products.category')}</Text>,
      cell: (info) => <Text color={textColor}>{info.getValue()}</Text>,
    }),
    columnHelper.accessor("price", {
      id: "price",
      header: () => <Text color="gray.400">{t('products.price')}</Text>,
      cell: (info) => <Text color={textColor}>kwd {info.getValue()}</Text>,
    }),
    columnHelper.accessor("quantity", {
      id: "quantity",
      header: () => <Text color="gray.400">{t('products.stock')}</Text>,
      cell: (info) => <Text color={textColor}>{info.getValue()}</Text>,
    }),
    columnHelper.accessor("isActive", {
      id: "status",
      header: () => <Text color="gray.400">{t('products.status')}</Text>,
      cell: (info) => (
        <Box dir="ltr">
          <Switch
            colorScheme="green"
            isChecked={info.getValue()}
            onChange={() => toggleStatus(info.row.original.id, info.getValue())}
            isDisabled={isFetching}
          />
        </Box>
      ),
    }),
    columnHelper.accessor("isPublished", {
      id: "publish",
      header: () => <Text color="gray.400">{t('products.publish')}</Text>,
      cell: (info) => (
        <Box dir="ltr">
          <Switch
            colorScheme="blue"
            isChecked={info.getValue()}
            onChange={() => togglePublish(info.row.original.id, info.getValue())}
            isDisabled={isFetching}
          />
        </Box>
      ),
    }),
    columnHelper.accessor("actions", {
      id: "actions",
      header: () => <Text color="gray.400">{t('products.actions')}</Text>,
      cell: (info) => (
        <Flex ml={isRTL ? 2 : 0} mr={!isRTL ? 2 : 0}>
          <Icon
            w="18px"
            h="18px"
            me="10px"
            color="blue.500"
            as={FaEye}
            cursor="pointer"
            onClick={() => navigate(`/admin/products/${info.row.original.id}`)}
          />
          <Icon
            w="18px"
            h="18px"
            me="10px"
            color="green.500"
            as={EditIcon}
            cursor="pointer"
            onClick={() => navigate(`/admin/edit-product/${info.row.original.id}`)}
          />
          <Icon
            w="18px"
            h="18px"
            me="10px"
            color="red.500"
            as={FaTrash}
            cursor="pointer"
            onClick={() => handleDelete(info.row.original.id)}
          />
        </Flex>
      ),
    }),
  ];

  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="container" dir={isRTL ? 'rtl' : 'ltr'}>
      <Card flexDirection="column" w="100%" pt={"20px"} px="0px" overflowX="auto">
        <Flex px="25px" mb="8px" justifyContent="space-between" align="center">
          <Text color={textColor} fontSize="22px" fontWeight="700">
            {t('products.title')}
          </Text>
          <Flex ml={isRTL ? 2 : 0} mr={!isRTL ? 2 : 0}>
            <Button
              variant="darkBrand"
              color="white"
              fontSize="sm"
              fontWeight="500"
              borderRadius="70px"
              px="24px"
              py="5px"
              onClick={() => navigate("/admin/add-product")}
              width={"200px"}
              ml={isRTL ? 2 : 0} mr={!isRTL ? 2 : 0}
            >
              <PlusSquareIcon me="10px" />
              {t('products.add')}
            </Button>
            
            <Menu>
              <MenuButton
                as={Button}
                rightIcon={<ChevronDownIcon />}
                leftIcon={<FaFileExport />}
                variant="outline"
                colorScheme="blue"
                ml={isRTL ? 2 : 0} mr={!isRTL ? 2 : 0}
              >
                {t('products.export')}
              </MenuButton>
              <MenuList>
                <MenuItem icon={<FaDownload />} onClick={exportToExcel}>
                  {t('products.exportExcel')}
                </MenuItem>
              </MenuList>
            </Menu>
            
            <Box ml={isRTL ? 2 : 0} mr={!isRTL ? 2 : 0} position="relative">
              <Button
                as="label"
                leftIcon={<FaUpload />}
                variant="outline"
                colorScheme="green"
                htmlFor="file-import"
                cursor="pointer"
              >
                {t('products.import')}
                <input
                  type="file"
                  id="file-import"
                  accept=".xlsx,.xls,.csv,.json"
                  onChange={handleFileImport}
                  style={{ display: 'none' }}
                />
              </Button>
            </Box>
          </Flex>
        </Flex>
        
        {/* Search Input */}
        <Flex px="25px" mb="20px">
          <InputGroup maxW="400px">
            <InputLeftElement pointerEvents="none">
              <FaSearch color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder={t('products.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              borderRadius="20px"
            />
          </InputGroup>
        </Flex>
        
        <Box>
          {isLoading ? (
            <Box p="20px">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} height="40px" mb="10px" />
              ))}
            </Box>
          ) : (
            <>
              <Table variant="simple" color="gray.500" mb="24px" mt="12px">
                <Thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <Tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <Th key={header.id} borderColor={borderColor}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </Th>
                      ))}
                    </Tr>
                  ))}
                </Thead>
                <Tbody>
                  {table.getRowModel().rows.map((row) => (
                    <Tr key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <Td key={cell.id} borderColor="transparent">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </Td>
                      ))}
                    </Tr>
                  ))}
                </Tbody>
              </Table>
              
              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <Flex justifyContent="center" mt={4} pb={4}>
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                  />
                </Flex>
              )}
              
              {/* Show total items count */}
              <Flex justifyContent="center" mt={2} pb={2}>
                <Text color="gray.500" fontSize="sm">
                  {t('products.showing')} {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.totalItems)} {t('products.of')} {pagination.totalItems} {t('products.products')}
                </Text>
              </Flex>
            </>
          )}
        </Box>
      </Card>
    </div>
  );
};

export default Products;