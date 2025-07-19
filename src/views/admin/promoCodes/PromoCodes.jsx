import React, { useEffect, useState } from "react";
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
  Input,
  InputGroup,
  InputLeftElement,
  IconButton,
  Select,
  Badge,
  useToast,
} from "@chakra-ui/react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { FaTrash } from "react-icons/fa6";
import { EditIcon, PlusSquareIcon, ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import Card from "components/card/Card";
import { useNavigate } from "react-router-dom";
import { useGetPromocodesQuery } from "api/promocodeSlice";
import Swal from "sweetalert2";
import { FaSearch } from "react-icons/fa";
import { useDeletePromocodeMutation, useUpdatePromocodeMutation } from "api/promocodeSlice";
import { useTranslation } from 'react-i18next';

const columnHelper = createColumnHelper();

const PromoCodes = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState({});
  
  // Color mode values
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const searchBg = useColorModeValue("secondaryGray.300", "gray.700");
  const inputText = useColorModeValue("gray.700", "white");
  const tableRowHover = useColorModeValue("gray.50", "gray.600");
  const bgColor = useColorModeValue("white", "gray.700");
  const cardBg = useColorModeValue('white', 'gray.700');
  const inputBg = useColorModeValue('gray.100', 'gray.700');
  const inputTextColor = useColorModeValue(undefined, 'white');
  const { data: promocodesResponse, isLoading, refetch } = useGetPromocodesQuery({ 
    page, 
    limit,
    search: debouncedSearchQuery,
    pharmacyId: JSON.parse(localStorage.getItem("pharmacy"))?.id 
  });

  useEffect(() => {
    refetch();
    
    // Handle page reload or exit
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, refetch]);

  const tableData = promocodesResponse?.data || [];
  const pagination = promocodesResponse?.pagination || { page: 1, limit: 10, totalItems: 0, totalPages: 1 };
  const [deletePromoCode] = useDeletePromocodeMutation();
  const [updatePromoCode] = useUpdatePromocodeMutation();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(1); // Reset to first page when searching
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredData = tableData; // No client-side filtering needed with server-side search

  const handleDelete = async (id) => {
    try {
      const result = await Swal.fire({
        title: t('common.areYouSure'),
        text: t('common.noRevert'),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: t('common.yesDeleteIt'),
      });

      if (result.isConfirmed) {
        await deletePromoCode(id).unwrap();
        setHasUnsavedChanges(true);
        refetch();
        toast({
          title: t('common.deleted'),
          description: t('common.promoCodeDeleted'),
          status: 'success',
          duration: 5000,
          isClosable: true,
          position: isRTL ? 'top-left' : 'top-right',
        });
      }
    } catch (error) {
      console.error('Failed to delete promo code:', error);
      toast({
        title: t('common.error'),
        description: t('common.failedDeletePromoCode'),
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: isRTL ? 'top-left' : 'top-right',
      });
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    try {
      setUpdatingStatus(prev => ({ ...prev, [id]: true }));
      const newStatus = !currentStatus;
      await updatePromoCode({
        id,
        data: {
          isActive: newStatus,
          pharmacyId: JSON.parse(localStorage.getItem("pharmacy"))?.id,
        }
      }).unwrap();
      
      refetch();
      toast({
        title: t('common.success'),
        description: newStatus ? t('promocode.statusActivated') : t('promocode.statusDeactivated'),
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: isRTL ? 'top-left' : 'top-right',
      });
    } catch (error) {
      console.error('Failed to update promo code status:', error);
      toast({
        title: t('common.error'),
        description: t('promocode.failedStatusUpdate'),
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: isRTL ? 'top-left' : 'top-right',
      });
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [id]: false }));
    }
  };

  const columns = [
    columnHelper.accessor("code", {
      id: "code",
      header: () => <Text color="gray.400">{t('common.code')}</Text>,
      cell: (info) => <Text color={textColor} fontWeight="600">{info.getValue()}</Text>,
    }),
    columnHelper.accessor("type", {
      id: "type",
      header: () => <Text color="gray.400">{t('common.type')}</Text>,
      cell: (info) => (
        <Badge
          colorScheme={info.getValue() === "FIXED" ? "blue" : "purple"}
          px={2}
          py={1}
          borderRadius="md"
          textTransform="capitalize"
        >
          {info.getValue() === "FIXED" ? t('promocode.fixed') : t('promocode.percentage')}
        </Badge>
      ),
    }),
    columnHelper.accessor("amount", {
      id: "amount",
      header: () => <Text color="gray.400">{t('common.amount')}</Text>,
      cell: (info) => (
        <Text color={textColor}>
          {info.row.original.type === "FIXED" ? `kwd ${info.getValue()}` : `${info.getValue()}%`}
        </Text>
      ),
    }),
    columnHelper.accessor("endDate", {
      id: "endDate",
      header: () => <Text color="gray.400">{t('common.endDate')}</Text>,
      cell: (info) => (
        <Text color={textColor}>
          {new Date(info.getValue()).toLocaleDateString()}
        </Text>
      ),
    }),
    columnHelper.accessor("maxUsage", {
      id: "maxUsage",
      header: () => <Text color="gray.400">{t('common.maxUsage')}</Text>,
      cell: (info) => <Text color={textColor}>{info.getValue()}</Text>,
    }),
    columnHelper.accessor("countUsage", {
      id: "countUsage",
      header: () => <Text color="gray.400">{t('common.used')}</Text>,
      cell: (info) => (
        <Text color={textColor}>
          {info.getValue()}/{info.row.original.maxUsage}
        </Text>
      ),
    }),
    columnHelper.accessor("isActive", {
      id: "status",
      header: () => <Text color="gray.400">{t('common.status')}</Text>,
      cell: (info) => (
        <Switch
          colorScheme="green"
          isChecked={info.getValue()}
          onChange={() => handleStatusToggle(info.row.original.id, info.getValue())}
          isDisabled={updatingStatus[info.row.original.id]}
          dir={'ltr'}
        />
      ),
    }),
    columnHelper.accessor("id", {
      id: "actions",
      header: () => <Text color="gray.400">{t('common.actions')}</Text>,
      cell: (info) => (
        <Flex>
          <IconButton
            aria-label={t('common.delete')}
            icon={<FaTrash />}
            size="sm"
            variant="ghost"
            colorScheme="red"
            onClick={() => handleDelete(info.getValue())}
            mr={2}
          />
          <IconButton
            aria-label={t('common.edit')}
            icon={<EditIcon />}
            size="sm"
            variant="ghost"
            colorScheme="blue"
            onClick={() => {
              setHasUnsavedChanges(true);
              navigate(`/admin/edit-promo-code/${info.getValue()}`);
            }}
          />
        </Flex>
      ),
    }),
  ];
  
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleNextPage = () => {
    if (page < pagination.totalPages) {
      setPage(page + 1);
    }
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleLimitChange = (e) => {
    setLimit(Number(e.target.value));
    setPage(1);
  };

  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }} dir={isRTL ? "rtl" : "ltr"}>
      <Card flexDirection="column" w="100%" px="0px" overflowX={{ sm: 'scroll', lg: 'hidden' }} bg={cardBg}>
        <Flex px="25px" mb="8px" justifyContent="space-between" align="center">
          <Text color={textColor} fontSize="22px" fontWeight="700" lineHeight="100%">
            {t('common.promoCodes')}
          </Text>
          
          <Flex align="center" gap={4}>
            <InputGroup w={{ base: "100%", md: "200px" }}>
              <InputLeftElement>
                <IconButton
                  bg="inherit"
                  borderRadius="inherit"
                  _hover="none"
                  _active={{ bg: "inherit" }}
                  icon={<FaSearch color="gray.400" />}
                />
              </InputLeftElement>
              <Input
                variant="search"
                fontSize="sm"
                bg={searchBg}
                color={inputText}
                fontWeight="500"
                _placeholder={{ color: 'gray.400', fontSize: '14px' }}
                borderRadius="30px"
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>
            
            <Button
              variant="darkBrand"
              color="white"
              fontSize="sm"
              fontWeight="500"
              borderRadius="70px"
              px="24px"
              py="5px"
              onClick={() => {
                setHasUnsavedChanges(true);
                navigate('/admin/add-promo-code');
              }}
              leftIcon={<PlusSquareIcon />}
            >
              {t('common.addPromoCode')}
            </Button>
          </Flex>
        </Flex>
        
        <Box>
          <Table variant="simple" color="gray.500" mb="24px" mt="12px">
            <Thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <Tr key={headerGroup.id} bg={bgColor}>
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
                <Tr key={row.id} _hover={{ bg: tableRowHover }}>
                  {row.getVisibleCells().map((cell) => (
                    <Td key={cell.id} borderColor="transparent">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </Td>
                  ))}
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>

        {/* Pagination Controls */}
        <Flex justifyContent="space-between" alignItems="center" px="25px" py="10px">
          <Flex alignItems="center">
            <Text color={textColor} fontSize="sm" mr="10px">
              {t('common.rowsPerPage')}:
            </Text>
            <Select
              value={limit}
              onChange={handleLimitChange}
              size="sm"
              w="80px"
              variant="outline"
              borderColor={borderColor}
              bg={inputBg}
              color={inputTextColor}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </Select>
          </Flex>
          
          <Text color={textColor} fontSize="sm">
            {t('common.page')} {pagination.page} {t('common.of')} {pagination.totalPages}
          </Text>
          
          <Flex>
            <Button
              onClick={handlePreviousPage}
              disabled={page === 1}
              variant="outline"
              size="sm"
              mr="10px"
              leftIcon={<ChevronLeftIcon />}
            >
              {t('common.previous')}
            </Button>
            <Button
              onClick={handleNextPage}
              disabled={page === pagination.totalPages}
              variant="outline"
              size="sm"
              rightIcon={<ChevronRightIcon />}
            >
              {t('common.next')}
            </Button>
          </Flex>
        </Flex>
      </Card>
    </Box>
  );
};

export default PromoCodes;