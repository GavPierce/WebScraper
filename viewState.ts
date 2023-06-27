import { baseView, baseEvent } from "./baseViewState";
import { viewData } from "./database_scripts/types";

export function formData(pageNumber:number = 0, viewData: viewData = { viewState: baseView, eventState: baseEvent}, county: number) {
    // Always get the latest data:
    const today = new Date();
    const month = today.getMonth() + 1; // Note: January is month 0
    const day = today.getDate();
    const year = today.getFullYear();


    const encodedEndDate = `${month}%2F${day}%2F${year}`;
    const encodedStartDate = `${month}%2F${day}%2F${year - 1}`;


    return `__EVENTTARGET=grdPermits%24_ctl1%24_ctl${pageNumber}&__EVENTARGUMENT=&__LASTFOCUS=&__VIEWSTATE=${viewData.viewState}&__VIEWSTATEGENERATOR=D19B23D8&__EVENTVALIDATION=${viewData.eventState}&rdoPermitType=0&tbxPermitNumber=&tbxBegDate=${encodedStartDate}&tbxEndDate=${encodedEndDate}&tbxContractorId=&tbxBusinessName=&tbxLastName=&tbxFirstName=&tbxUBI=&tbxSiteOwner=&tbxSiteLastName=&tbxSiteFirstName=&tbxSiteAddr1=&tbxSiteCity=&lstSiteCounty=${county}&URL=https%3A%2F%2Flni.wa.gov%2Flicensing-permits%2Felectrical%2Felectrical-permits-fees-and-inspections%2Fpurchase-permits-request-inspections`
}