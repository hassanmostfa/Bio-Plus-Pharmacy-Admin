import {
  Box,
  Button,
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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  useToast,
  Badge,
  Skeleton,
} from '@chakra-ui/react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import * as React from 'react';
import Card from 'components/card/Card';
import { EditIcon, SearchIcon } from '@chakra-ui/icons';
import { FaEye, FaTrash } from 'react-icons/fa6';
import { useNavigate } from 'react-router-dom';
import { CgAssign } from 'react-icons/cg';
import { CiSearch } from "react-icons/ci";
import { AiFillMedicineBox } from "react-icons/ai";
import { useTranslation } from 'react-i18next';
import Pagination from "theme/components/Pagination";

import { useGetPrescriptionsQuery, useUpdatePrescriptionStatusMutation } from "api/prescription";

const columnHelper = createColumnHelper();

const Prescriptions = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [sorting, setSorting] = React.useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedPrescription, setSelectedPrescription] = React.useState(null);
  const [statusFilter, setStatusFilter] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const { t } = useTranslation();

  // Debounce search term to avoid too many API calls
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1); // Reset to first page when searching
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch prescriptions from API with search and pagination parameters
  const { data: apiResponse, isLoading, isError, refetch } = useGetPrescriptionsQuery({
    page,
    limit,
    search: debouncedSearchTerm,
    status: statusFilter,
    pharmacyId: JSON.parse(localStorage.getItem('pharmacy')).id
  });
  const [updateStatus] = useUpdatePrescriptionStatusMutation();

  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');

  // Transform API data to match table structure
  const prescriptionsData = React.useMemo(() => {
    if (!apiResponse?.data?.data) return [];
    
    return apiResponse.data.data.map(prescription => ({
      id: prescription.id,
      user: prescription.user.name,
      image: prescription.document.fileKey,
      phoneNumber: prescription.user.phoneNumber,
      uploadDate: new Date(prescription.createdAt).toLocaleDateString(),
      status: prescription.status,
      originalData: prescription, // Keep original data for actions
    }));
  }, [apiResponse]);

  // Extract pagination data from response
  const pagination = apiResponse?.data?.meta || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  };

  // Handle page change
  const handlePageChange = React.useCallback((newPage) => {
    setPage(newPage);
  }, []);

  // Handle status filter change
  const handleStatusFilterChange = React.useCallback((newStatus) => {
    setStatusFilter(newStatus);
    setPage(1); // Reset to first page when filtering
  }, []);

  const columns = [
    columnHelper.accessor('user', {
      header: t('prescriptions.user'),
      cell: (info) => <Text color={textColor}>{info.getValue()}</Text>,
    }),
    columnHelper.accessor('image', {
      header: t('prescriptions.prescription'),
      cell: (info) => (
        <img
          src={info.getValue()}
          alt={t('prescriptions.prescription')}
          width={70}
          height={70}
          style={{ borderRadius: '8px', cursor: 'pointer' }}
          onClick={() => window.open(info.getValue(), '_blank')}
        />
      ),
    }),
    columnHelper.accessor('phoneNumber', {
      header: t('prescriptions.phoneNumber'),
      cell: (info) => <Text color={textColor}>{info.getValue()}</Text>,
    }),
    columnHelper.accessor('uploadDate', {
      header: t('prescriptions.uploadDate'),
      cell: (info) => <Text color={textColor}>{info.getValue()}</Text>,
    }),
    columnHelper.accessor('status', {
      header: t('prescriptions.status'),
      cell: (info) => {
        const status = info.getValue();
        let colorScheme;
        
        switch(status) {
          case 'COMPLETED': colorScheme = 'green'; break;
          case 'PROCESSING': colorScheme = 'blue'; break;
          case 'REJECTED': colorScheme = 'red'; break;
          case 'PENDING': colorScheme = 'orange'; break;
          default: colorScheme = 'gray';
        }
        
        return (
          <Badge colorScheme={colorScheme} px={3} py={1} borderRadius="full">
            {t(`prescriptions.statusEnum.${status}`)}
          </Badge>
        );
      },
    }),
    columnHelper.accessor('actions', {
      header: t('prescriptions.actions'),
      cell: (info) => {
        const prescription = info.row.original;
        
        return (
          <Flex align="center" gap="10px">
            <Select
              size="sm"
              width="120px"
              value={prescription.status}
              onChange={async (e) => {
                try {
                  await updateStatus({
                    id: prescription.id,
                    status: e.target.value
                  }).unwrap();
                  refetch();
                  toast({
                    title: t('prescriptions.statusUpdated'),
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                  });
                } catch (error) {
                  toast({
                    title: t('prescriptions.errorUpdatingStatus'),
                    description: error.message,
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                  });
                }
              }}
            >
              <option value="PENDING">{t('prescriptions.statusEnum.PENDING')}</option>
              <option value="PROCESSING">{t('prescriptions.statusEnum.PROCESSING')}</option>
              <option value="COMPLETED">{t('prescriptions.statusEnum.COMPLETED')}</option>
              <option value="REJECTED">{t('prescriptions.statusEnum.REJECTED')}</option>
            </Select>
            
            <Icon
              as={AiFillMedicineBox}
              w="18px"
              h="18px"
              color="teal.500"
              cursor="pointer"
              title={t('prescriptions.addToCart')}
              onClick={() => navigate(`/admin/add-prescription/${prescription.id}`)}
            />
          </Flex>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: prescriptionsData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isError) return <Text>{t('prescriptions.errorLoading')}</Text>;

  return (
    <div className="container">
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
            {t('prescriptions.allPrescriptions')}
          </Text>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <InputGroup borderRadius="15px" background={"gray.100"} w={{ base: "300", md: "300px" }}>
              <InputLeftElement pointerEvents="none">
                <CiSearch color="gray.400" />
              </InputLeftElement>
              <Input
                variant="outline"
                fontSize="sm"
                placeholder={t('prescriptions.search')}
                border="1px solid"
                borderColor="gray.200"
                _hover={{ borderColor: "gray.400" }}
                borderRadius={"15px"}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
            
            <Select
              placeholder={t('prescriptions.filterByStatus')}
              width="300px"
              background={"gray.100"}
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value || '')}
              variant="outline"
              fontSize="sm"
              border="1px solid"
              borderColor="gray.200"
              _hover={{ borderColor: "gray.400" }}
              borderRadius={"15px"}
            >
              <option value="">{t('prescriptions.allStatuses')}</option>
              <option value="PENDING">{t('prescriptions.statusEnum.PENDING')}</option>
              <option value="PROCESSING">{t('prescriptions.statusEnum.PROCESSING')}</option>
              <option value="COMPLETED">{t('prescriptions.statusEnum.COMPLETED')}</option>
              <option value="REJECTED">{t('prescriptions.statusEnum.REJECTED')}</option>
            </Select>
          </div>
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
                      ))}
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
                  {t('prescriptions.showing')} {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} {t('prescriptions.of')} {pagination.total} {t('prescriptions.prescriptions')}
                </Text>
              </Flex>
            </>
          )}
        </Box>
      </Card>
    </div>
  );
};

export default Prescriptions;