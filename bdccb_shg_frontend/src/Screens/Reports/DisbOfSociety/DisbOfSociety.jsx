import React, { useEffect, useState } from "react"
import Sidebar from "../../../Components/Sidebar"
import axios from "axios"
import { url, url_bdccb } from "../../../Address/BaseUrl"
import { Message } from "../../../Components/Message"
import { Spin, Tooltip } from "antd"
import {
    LoadingOutlined,
    SearchOutlined,
    PrinterOutlined,
    FileExcelOutlined,
} from "@ant-design/icons"
import { RefreshOutlined, Search } from "@mui/icons-material"
import Radiobtn from "../../../Components/Radiobtn"
import TDInputTemplateBr from "../../../Components/TDInputTemplateBr"
import { getLocalStoreTokenDts } from "../../../Components/getLocalforageTokenDts"

import { saveAs } from "file-saver"
import * as XLSX from "xlsx"
import { printTableRegular } from "../../../Utils/printTableRegular"
import DynamicTailwindTable from "../../../Components/Reports/DynamicTailwindTable"
import Select from "react-select"
import {
    branchwiseDemandReportHeader,
    cowiseDemandReportHeader,
    fundwiseDemandReportHeader,
    groupwiseDemandReportHeader,
    memberwiseDemandReportHeader,
} from "../../../Utils/Reports/headerMap"
import { routePaths } from "../../../Assets/Data/Routes"
import { useNavigate } from "react-router"
import { use } from "react"

function DisbOfSociety() {
   const navigate = useNavigate()
    const [PACS_SHGList, setPACS_SHGList] = useState([]);
    const [selectedPacs, setSelectedPacs] = useState("");
    const [fromDate, setFromDate] = useState("")
    const [toDate, setToDate] = useState("")
    const [data,setData] = useState([])
    const userDetails = JSON.parse(localStorage.getItem("user_details")) || ""
    // const tokenValue =  getLocalStoreTokenDts(navigate);
    const [loading,setLoading] = useState(false)
    const onSubmit =()=>{
        const tokenValue = getLocalStoreTokenDts(navigate);
        setLoading(true)
        axios.get(`${url_bdccb}/report/get_disburs_dtls?frm_dt=${fromDate}&to_dt=${toDate}&branch_id=${userDetails[0]?.brn_code}`, {headers: {
                Authorization: `${tokenValue?.token}`, // example header
                "Content-Type": "application/json", // optional
            }},).then((res)=>{
        console.log(res)
        setLoading(false)
        setData(res?.data?.data || [])
        // Message("Success", res?.data?.message || "Report fetched successfully", "success")
    }).catch((err)=>{
        console.log(err)

    })}

    const dataHeaders = {
         loan_id: "Loan ID",
            period: "Period",
            curr_roi: "Current ROI",
            disb_dt: "Disbursement Date",
            disb_amt: "Disbursement Amount",
            group_name: "Group Name",
            member_name: "Member Name",
            member_account_no: "Member Account Number"
    }
    useEffect(() => {
        const creds = {
            loan_to: 'P',
            branch_code: userDetails[0]?.brn_code,
            branch_shg_id: '',
            tenant_id: userDetails[0]?.tenant_id,
        }

        const tokenValue = getLocalStoreTokenDts(navigate);

        axios.post(`${url_bdccb}/loan/fetch_pacs_shg_details`, creds, {
            headers: {
                Authorization: `${tokenValue?.token}`, // example header
                "Content-Type": "application/json", // optional
            },
        })
            .then((res) => {
                console.log(res?.data?.data?.map((item, i) => ({
                    code: item?.branch_id,
                    name: item?.branch_name,
                })))
                setPACS_SHGList(res?.data?.data?.map((item, i) => ({
                    code: item?.branch_id,
                    name: item?.branch_name,
                })))
            })
            .catch((err) => {
                console.log(err)
                Message("Error", err?.response?.data?.message || "Something went wrong", "error")
            })
    }, [])
    return (
        <div>
            <Sidebar mode={2} />
            <Spin
                indicator={<LoadingOutlined spin />}
                size="large"
                className="text-slate-800 dark:text-gray-400"
                spinning={false}
            >
                <main className="px-4 pb-5 bg-slate-50 rounded-lg shadow-lg h-auto my-10 mx-32">
                    <div className="flex flex-row gap-3 mt-20  py-3 rounded-xl">
                        <div className="text-3xl text-slate-700 font-bold">
                            Disbursement of Society
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5 mt-5 items-center">
                        <div>
                            <TDInputTemplateBr
                                placeholder="From Date"
                                type="date"
                                label="From Date"
                                name="fromDate"
                                formControlName={fromDate}
                                handleChange={(e) => setFromDate(e.target.value)}
                                min={"1900-12-31"}
                                mode={1}
                            />
                        </div>
                        <div>
                            <TDInputTemplateBr
                                placeholder="To Date"
                                type="date"
                                label="To Date"
                                name="toDate"
                                formControlName={toDate}
                                handleChange={(e) => setToDate(e.target.value)}
                                min={"1900-12-31"}
                                mode={1}
                            />
                        </div>
                       
                    </div>
                    <div className="flex justify-center items-center">
          <button onClick={()=>onSubmit()} disabled={loading}  className=" disabled:bg-gray-400 disabled:dark:bg-gray-400 inline-flex items-center px-5 py-2.5 mt-4 sm:mt-6 text-sm font-medium text-center text-white bg-teal-500 duration-300  rounded-full focus:ring-gray-600  dark:focus:ring-primary-900 dark:bg-[#22543d] dark:hover:bg-gray-600">{loading? 'Processing...':'Submit'}</button>

                    </div>
                    <div>
                        {/* {absentListData?.length > 0 && searchType2 === "A" && ( */}
						<DynamicTailwindTable
							data={data}
							headersMap={dataHeaders}
							pageSize={20}
							indexing
							// dateTimeExceptionCols={[4]}
						/>
					{/* )} */}
                    </div>
                </main>
            </Spin>
        </div>
    )
}

export default DisbOfSociety