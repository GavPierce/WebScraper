import { baseView, baseEvent } from "./baseViewState";
import { viewData } from "./database_scripts/types";

export function formData(pageNumber:number = 0, viewData: viewData = { viewState: baseView, eventState: baseEvent}, county:number = 19) {
    // Always get the latest data:
    const today = new Date();
    const month = today.getMonth() + 1; // Note: January is month 0
    const day = today.getDate();
    const year = today.getFullYear();

    const encodedDate = `${month}%2F${day}%2F${year}`;


    return `__EVENTTARGET=grdPermits%24_ctl1%24_ctl${pageNumber}&__EVENTARGUMENT=&__LASTFOCUS=&__VIEWSTATE=${baseView}&__VIEWSTATEGENERATOR=D19B23D8&__EVENTVALIDATION=${baseEvent}&rdoPermitType=0&tbxPermitNumber=&tbxBegDate=4%2F29%2F2022&tbxEndDate=5%2F29%2F2023&tbxContractorId=&tbxBusinessName=&tbxLastName=&tbxFirstName=&tbxUBI=&tbxSiteOwner=&tbxSiteLastName=&tbxSiteFirstName=&tbxSiteAddr1=&tbxSiteCity=&lstSiteCounty=19&URL=https%3A%2F%2Flni.wa.gov%2Flicensing-permits%2Felectrical%2Felectrical-permits-fees-and-inspections%2Fpurchase-permits-request-inspections`
}