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
import { useDeletePromocodeMutation } from "api/promocodeSlice";
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
  
  // Color mode values
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const searchBg = useColorModeValue("secondaryGray.300", "gray.700");
  const inputText = useColorModeValue("gray.700", "white");
  const tableRowHover = useColorModeValue("gray.50", "gray.600");
  const bgColor = useColorModeValue("white", "gray.700");
  const { data: promocodesResponse, isLoading, refetch } = useGetPromocodesQuery({ 
    page, 
    limit,
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

  const filteredData = React.useMemo(() => {
    if (!searchQuery) return tableData;
    return tableData.filter((promo) =>
      Object.values(promo).some((value) =>
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
    ));
  }, [tableData, searchQuery]);

  const handleDelete = async (id) => {
    try {
      const result = await Swal.fire({
        title: t('areYouSure'),
        text: t('noRevert'),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: t('yesDeleteIt'),
        background: {bgColor},
        color: textColor,
      });

      if (result.isConfirmed) {
        await deletePromoCode(id).unwrap();
        setHasUnsavedChanges(true);
        refetch();
        toast({
          title: t('deleted'),
          description: t('promoCodeDeleted'),
          status: 'success',
          duration: 5000,
          isClosable: true,
          position: isRTL ? 'top-left' : 'top-right',
        });
      }
    } catch (error) {
      console.error('Failed to delete promo code:', error);
      toast({
        title: t('error'),
        description: t('failedDeletePromoCode'),
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: isRTL ? 'top-left' : 'top-right',
      });
    }
  };

  const columns = [
    columnHelper.accessor("code", {
      id: "code",
      header: () => <Text color="gray.400">{t('code')}</Text>,
      cell: (info) => <Text color={textColor} fontWeight="600">{info.getValue()}</Text>,
    }),
    columnHelper.accessor("type", {
      id: "type",
      header: () => <Text color="gray.400">{t('type')}</Text>,
      cell: (info) => (
        <Badge
          colorScheme={info.getValue() === "FIXED" ? "blue" : "purple"}
          px={2}
          py={1}
          borderRadius="md"
          textTransform="capitalize"
        >
          {t(info.getValue().toLowerCase())}
        </Badge>
      ),
    }),
    columnHelper.accessor("amount", {
      id: "amount",
      header: () => <Text color="gray.400">{t('amount')}</Text>,
      cell: (info) => (
        <Text color={textColor}>
          {info.row.original.type === "FIXED" ? `kwd ${info.getValue()}` : `${info.getValue()}%`}
        </Text>
      ),
    }),
    columnHelper.accessor("endDate", {
      id: "endDate",
      header: () => <Text color="gray.400">{t('endDate')}</Text>,
      cell: (info) => (
        <Text color={textColor}>
          {new Date(info.getValue()).toLocaleDateString()}
        </Text>
      ),
    }),
    columnHelper.accessor("maxUsage", {
      id: "maxUsage",
      header: () => <Text color="gray.400">{t('maxUsage')}</Text>,
      cell: (info) => <Text color={textColor}>{info.getValue()}</Text>,
    }),
    columnHelper.accessor("countUsage", {
      id: "countUsage",
      header: () => <Text color="gray.400">{t('used')}</Text>,
      cell: (info) => (
        <Text color={textColor}>
          {info.getValue()}/{info.row.original.maxUsage}
        </Text>
      ),
    }),
    columnHelper.accessor("isActive", {
      id: "status",
      header: () => <Text color="gray.400">{t('status')}</Text>,
      cell: (info) => (
        <Switch
          colorScheme="green"
          isChecked={info.getValue()}
        />
      ),
    }),
    columnHelper.accessor("id", {
      id: "actions",
      header: () => <Text color="gray.400">{t('actions')}</Text>,
      cell: (info) => (
        <Flex>
          <IconButton
            aria-label={t('delete')}
            icon={<FaTrash />}
            size="sm"
            variant="ghost"
            colorScheme="red"
            onClick={() => handleDelete(info.getValue())}
            mr={2}
          />
          <IconButton
            aria-label={t('edit')}
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
      <Card flexDirection="column" w="100%" px="0px" overflowX={{ sm: 'scroll', lg: 'hidden' }}>
        <Flex px="25px" mb="8px" justifyContent="space-between" align="center">
          <Text color={textColor} fontSize="22px" fontWeight="700" lineHeight="100%">
            {t('promoCodes')}
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
                placeholder={t('search')}
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
              {t('addPromoCode')}
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
              {t('rowsPerPage')}:
            </Text>
            <Select
              value={limit}
              onChange={handleLimitChange}
              size="sm"
              w="80px"
              variant="outline"
              borderColor={borderColor}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </Select>
          </Flex>
          
          <Text color={textColor} fontSize="sm">
            {t('page')} {pagination.page} {t('of')} {pagination.totalPages}
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
              {t('previous')}
            </Button>
            <Button
              onClick={handleNextPage}
              disabled={page === pagination.totalPages}
              variant="outline"
              size="sm"
              rightIcon={<ChevronRightIcon />}
            >
              {t('next')}
            </Button>
          </Flex>
        </Flex>
      </Card>
    </Box>
  );
};

export default PromoCodes;