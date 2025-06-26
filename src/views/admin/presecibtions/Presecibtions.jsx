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

import { useGetPrescriptionsQuery, useUpdatePrescriptionStatusMutation } from "api/prescription";

const columnHelper = createColumnHelper();

const Prescriptions = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [sorting, setSorting] = React.useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedPrescription, setSelectedPrescription] = React.useState(null);
  const [statusFilter, setStatusFilter] = React.useState('');

  // Fetch prescriptions from API
  const { data: apiResponse, isLoading, isError, refetch } = useGetPrescriptionsQuery();
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

  // Filter data based on status
  const filteredData = React.useMemo(() => {
    if (!statusFilter) return prescriptionsData;
    return prescriptionsData.filter(item => item.status === statusFilter);
  }, [prescriptionsData, statusFilter]);

  const columns = [
    columnHelper.accessor('user', {
      header: 'User',
      cell: (info) => <Text color={textColor}>{info.getValue()}</Text>,
    }),
    columnHelper.accessor('image', {
      header: 'Prescription',
      cell: (info) => (
        <img
          src={info.getValue()}
          alt="Prescription"
          width={70}
          height={70}
          style={{ borderRadius: '8px', cursor: 'pointer' }}
          onClick={() => window.open(info.getValue(), '_blank')}
        />
      ),
    }),
    columnHelper.accessor('phoneNumber', {
      header: 'Phone Number',
      cell: (info) => <Text color={textColor}>{info.getValue()}</Text>,
    }),
    columnHelper.accessor('uploadDate', {
      header: 'Upload Date',
      cell: (info) => <Text color={textColor}>{info.getValue()}</Text>,
    }),
    columnHelper.accessor('status', {
      header: 'Status',
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
            {status}
          </Badge>
        );
      },
    }),
    columnHelper.accessor('actions', {
      header: 'Actions',
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
                    title: 'Status updated',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                  });
                } catch (error) {
                  toast({
                    title: 'Error updating status',
                    description: error.message,
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                  });
                }
              }}
            >
              <option value="PENDING">PENDING</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="REJECTED">REJECTED</option>
            </Select>
            
            <Icon
              as={AiFillMedicineBox}
              w="18px"
              h="18px"
              color="teal.500"
              cursor="pointer"
              title="Add to cart"
              onClick={() => navigate(`/admin/add-prescription/${prescription.id}`)}
            />
          </Flex>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isLoading) return <Text>Loading prescriptions...</Text>;
  if (isError) return <Text>Error loading prescriptions</Text>;

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
            All Prescriptions
          </Text>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <InputGroup borderRadius="15px" background={"gray.100"} w={{ base: "300", md: "300px" }}>
              <InputLeftElement pointerEvents="none">
                <CiSearch color="gray.400" />
              </InputLeftElement>
              <Input
                variant="outline"
                fontSize="sm"
                placeholder="Search..."
                border="1px solid"
                borderColor="gray.200"
                _hover={{ borderColor: "gray.400" }}
                borderRadius={"15px"}
              />
            </InputGroup>
            
            <Select
              placeholder="Filter by status"
              width="300px"
              background={"gray.100"}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value || '')}
              variant="outline"
              fontSize="sm"
              border="1px solid"
              borderColor="gray.200"
              _hover={{ borderColor: "gray.400" }}
              borderRadius={"15px"}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="REJECTED">REJECTED</option>
            </Select>
          </div>
        </Flex>
        
        <Box>
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
        </Box>
      </Card>
    </div>
  );
};

export default Prescriptions;