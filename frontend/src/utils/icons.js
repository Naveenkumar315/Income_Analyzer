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
import upload from "../assets/icons/upload.png";
import trash2 from "../assets/icons/trash-2.png";
import file from "../assets/icons/file.png";
import eye from "../assets/icons/eye.svg";
import text_search from "../assets/icons/text-search.svg";
import arrow_right from "../assets/icons/arrow-right.svg";
import x_close from "../assets/icons/x.svg";
import move from "../assets/icons/move.svg";
import move_active from "../assets/icons/move_active.svg";
import move_active_income from "../assets/icons/move_active_income.svg";
import merge from "../assets/icons/merge.svg";
import user_plus from "../assets/icons/user-plus.svg";
import fileActive from "../assets/icons/file-text-active.svg";
import fileInactive from "../assets/icons/file-text.svg";
import database_backup from "../assets/icons/database-backup.svg";
import database_backup_active from "../assets/icons/database-backup_active.svg";
import rotate_cw from "../assets/icons/rotate-cw.svg";
import pencil_line from "../assets/icons/pencil-line.svg";
import pencil_line_active from "../assets/icons/pencil-line-active.svg";
import Frame from "../assets/icons/Frame 1166.svg";
import circle_alert from "../assets/icons/circle-alert.svg";
import octagon_alert from "../assets/icons/octagon-alert.svg";
import circle_check_rule from "../assets/icons/circle-check-rule.svg";
import chevron_down from "../assets/icons/chevron-down.svg";
import plus from "../assets/icons/plus.svg";
import search from "../assets/icons/search.svg";

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
    },
    upload: {
        trash2,
        upload,
        file
    },
    loanDocument: {
        eye,
        text_search,
        arrow_right,
        x_close,
        move,
        move_active,
        move_active_income,
        merge,
        user_plus,
        fileActive,
        fileInactive,
        database_backup,
        database_backup_active,
        rotate_cw,
        pencil_line,
        pencil_line_active,
    },

    analyticResult: {
        Frame,
        circleCheck,
        circleClose,
        circle_alert,
        octagon_alert,
        circle_check_rule,
    },
    processedLoans: {
        chevron_down,
        plus,
        search,
        scrollText,
    }

};
