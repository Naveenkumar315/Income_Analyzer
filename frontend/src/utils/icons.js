import circleDollar from "../assets/menu/circle-dollar-sign.svg";
import circleDollarBlue from "../assets/menu/circle-dollar-sign-blue.svg";
import layoutDashboard from "../assets/menu/layout-dashboard.svg";
import layoutDashboardBlue from "../assets/menu/layout-dashboard-blue.svg";
import scrollText from "../assets/menu/scroll-text.svg";
import scrollTextBlue from "../assets/menu/scroll-text-blue.svg";
import settings from "../assets/menu/settings.svg";
import settingsBlue from "../assets/menu/settings-blue.svg";
import users from "../assets/menu/users.svg";
import usersBlue from "../assets/menu/users-blue.svg";
import logo from "../assets/loandna.png";
import dna_strand from "../assets/dna-strand.svg";
import microsoft from "../assets/Microsoft icon.svg"
import circleCheck from "../assets/icons/circle-check.svg";
import circleClose from "../assets/icons/circle-close.svg";
import deleteIcon from "../assets/icons/delete.svg";

export const Icons = {
    dashboard: {
        default: layoutDashboard,
        active: layoutDashboardBlue,
    },
    incomeAnalyzer: {
        default: circleDollar,
        active: circleDollarBlue,
    },
    rules: {
        default: scrollText,
        active: scrollTextBlue,
    },
    settings: {
        default: settings,
        active: settingsBlue,
    },
    users: {
        default: users,
        active: usersBlue,
    },
    header: {
        logo,
        dna_strand,
    },
    login: {
        microsoft
    },
    adminTable: {
        circleCheck,
        circleClose,
        deleteIcon,
    }

};
