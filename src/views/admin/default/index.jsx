import {
  Box,
  SimpleGrid,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";
import IconBox from "components/icons/IconBox";
import MiniStatistics from "components/card/MiniStatistics";
import {
  MdOutlineShoppingCart,
  MdAssignment,
} from "react-icons/md";
import CheckTable from "views/admin/default/components/CheckTable";
import { columnsDataCheck } from "views/admin/default/variables/columnsData";
import tableDataCheck from "views/admin/default/variables/tableDataCheck.json";

import { LuShoppingBasket } from "react-icons/lu";
import { useGetStatsQuery } from "api/pharmacySlice";
import { useTranslation } from "react-i18next";
import i18n from "../../../i18n";

export default function UserReports() {
  const brandColor = useColorModeValue("brand.500", "white");
  const boxBg = useColorModeValue("secondaryGray.300", "whiteAlpha.100");
  const { data: stats } = useGetStatsQuery();
  const { t } = useTranslation();
  
  const cardData = [
    { name: t("dashboard.totalOrders"), value: stats?.data?.totalOrders || 0, icon: MdOutlineShoppingCart },
    { name: t("dashboard.totalProducts"), value: stats?.data?.totalProducts || 0, icon: LuShoppingBasket },
    { name: t("dashboard.totalPrescriptions"), value: stats?.data?.totalPrescriptions || 0, icon: MdAssignment },
  ];

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }} dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Updated Cards Section */}
      <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap="20px" mb="20px">
        {cardData.map((card, index) => (
          <MiniStatistics
            key={index}
            startContent={
              <IconBox
                w="56px"
                h="56px"
                bg={boxBg}
                icon={<Icon w="32px" h="32px" as={card.icon} color={brandColor} />}
              />
            }
            name={card.name}
            value={card.value}
          />
        ))}
      </SimpleGrid>

    
    </Box>
  );
}
