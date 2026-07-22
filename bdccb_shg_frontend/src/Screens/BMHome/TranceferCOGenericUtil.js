import axios from "axios"
import { url } from "../../Address/BaseUrl"
import { getLocalStoreTokenDts } from "../../Components/getLocalforageTokenDts"
import { useNavigate } from "react-router-dom"
import { routePaths } from "../../Assets/Data/Routes"

export const fetchCONamesBranchWise = async (payload, navigate) => {
	// const navigate = useNavigate()

	const tokenValue = await getLocalStoreTokenDts(navigate);
	
	const { data } = await axios.post(`${url}/fetch_co_name_branchwise`, payload, {
headers: {
Authorization: `${tokenValue?.token}`, // example header
"Content-Type": "application/json", // optional
},
})

if(data?.suc === 0){
			// Message('error', res?.data?.msg)
			navigate(routePaths.LANDING)
			localStorage.clear()
			} else {
	return (
		data.msg.map((el) => ({ label: el.to_co_name, value: el.to_co_id })) ?? []
	)
}
}

export const fetchCompletePendingRequestDetails = async (payload, navigate) => {

	// const navigate = useNavigate()

	const tokenValue = await getLocalStoreTokenDts(navigate);

	const { data } = await axios.post(
		`${url}/transfer_co_view_all_details`, payload, {
headers: {
Authorization: `${tokenValue?.token}`, // example header
"Content-Type": "application/json", // optional
},
})

			// .then((res) => {
				
			if(data?.suc === 0){
			// Message('error', res?.data?.msg)
			navigate(routePaths.LANDING)
			localStorage.clear()
			} else {

			return Array.isArray(data.msg) ? data.msg[0] : null

			}

			// })
			// .catch((err) => {
			// console.log("?????????????????????", err)
			// })

	
}

export const getUserDetails = () => {
	const userDetailsData = localStorage.getItem("user_details")
	return userDetailsData ? JSON.parse(userDetailsData) : null
}

export const fetchBranches = async (payload, navigate) => {

	const tokenValue = await getLocalStoreTokenDts(navigate);

	const { data } = await axios.post(`${url}/fetch_branch_name`, payload, {
	headers: {
	Authorization: `${tokenValue?.token}`, // example header
	"Content-Type": "application/json", // optional
	},
	})

	if(data?.suc === 0){
	// Message('error', res?.data?.msg)
	navigate(routePaths.LANDING)
	localStorage.clear()
	} else {
	return Array.isArray(data.msg) ? data.msg.map((el) => ({ label: el.branch_name, value: el.branch_code })) : []
	}
}

export const TRANSFER_CO_ERROR_MSG = {
	NotFromPendingList:
		"Sorry system didn't receive any records from pending list. Please go back to the pending list and select one.",
}

export const TRANSFER_CO_PARAMS = {
	REMARKS: {
		name: "remarks",
		label: "Remarks",
	},
	GROUP_NAME_CODE: {
		name: "group_code",
		label: "Group Code With Name",
	},
	FROM_CO: {
		name: "frm_co",
		label: "From CO",
	},
	TO_CO: {
		name: "to_co",
		label: "To CO",
	},
	FROM_BRANCH: {
		name: "frm_branch",
		label: "From Branch",
	},
	TO_BRANCH: {
		name: "to_brn",
		label: "To Branch",
	},
	CREATED_BY: {
		name: "created_by",
		label: "Created By",
	},
	CREATED_DATE: {
		name: "created_at",
		label: "Created Date",
	},
}

export const defaultTransferCOGenericFormProps = {
	onEditModeUpdateRequest: () => {},
	inactiveSearchGroup: false,
	inactiveFromCO: false,
	inactiveFromBranch: false,
	inactiveToCO: false,
	inactiveToBranch: false,
	inactiveRemarks: false,
	receivedData: null,
}
