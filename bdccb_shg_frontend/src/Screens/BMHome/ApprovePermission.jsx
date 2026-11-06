import React, { useEffect, useState } from "react"
import axios from "axios"
import { url_bdccb } from "../../Address/BaseUrl"
import { Message } from "../../Components/Message"
import { Spin, Popconfirm, Tag, Tooltip } from "antd"
import { LoadingOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons"
import { getLocalStoreTokenDts } from "../../Components/getLocalforageTokenDts"
import { useNavigate } from "react-router"
import { routePaths } from "../../Assets/Data/Routes"
import { motion } from "framer-motion"
import { Paginator } from "primereact/paginator"
import Radiobtn from "../../Components/Radiobtn"

const options_status = [
	{
		label: "Pending",
		value: "N",
	},
	{
		label: "Approved",
		value: "Y",
	},
	{
		label: "Rejected",
		value: "R",
	},
]

function ApprovePermission() {
	const userDetails = JSON.parse(localStorage.getItem("user_details")) || ""
	const [loading, setLoading] = useState(false)
	const [permissionList, setPermissionList] = useState([])
	const [copyPermissionList, setCopyPermissionList] = useState([])
	const [approvalStatus, setApprovalStatus] = useState("N")
	const [first, setFirst] = useState(0)
	const [rows, setRows] = useState(10)

	const navigate = useNavigate()

	const onPageChange = (event) => {
		setFirst(event.first)
		setRows(event.rows)
	}

	const fetchPermissions = async () => {
		setLoading(true)
		try {
			const tokenValue = await getLocalStoreTokenDts(navigate)
			const { data } = await axios.get(`${url_bdccb}/user/permission_list`, {
				params: {
					tenant_id: userDetails[0]?.tenant_id,
					branch_id: userDetails[0]?.brn_code,
					approval_status: approvalStatus,
				},
				headers: {
					Authorization: `${tokenValue?.token}`,
					"Content-Type": "application/json",
				},
			})

			if (data?.success) {
				setPermissionList(data?.data || [])
				setCopyPermissionList(data?.data || [])
			} else {
				Message("error", data?.msg || "Failed to fetch permission list.")
			}
		} catch (err) {
			Message("error", "Some error occurred while fetching permissions.")
			console.error(err)
		}
		setLoading(false)
	}

	const handleApproveReject = async (record, action) => {
		setLoading(true)
		try {
			const tokenValue = await getLocalStoreTokenDts(navigate)
			const { data } = await axios.post(
				`${url_bdccb}/user/update_permission_status`,
				{
					permission_id: record?.permission_id,
					approval_status: action, // "Y" for approve, "R" for reject
					modified_by: userDetails[0]?.emp_id,
					tenant_id: userDetails[0]?.tenant_id,
					branch_id: userDetails[0]?.brn_code,
				},
				{
					headers: {
						Authorization: `${tokenValue?.token}`,
						"Content-Type": "application/json",
					},
				}
			)

			if (data?.success) {
				Message("success", action === "Y" ? "Permission approved successfully." : "Permission rejected.")
				fetchPermissions()
			} else {
				Message("error", data?.msg || "Operation failed.")
			}
		} catch (err) {
			Message("error", "Some error occurred while updating permission.")
			console.error(err)
		}
		setLoading(false)
	}

	const setSearch = (word) => {
		setPermissionList(
			copyPermissionList?.filter(
				(e) =>
					e?.user_name?.toString()?.toLowerCase()?.includes(word?.toLowerCase()) ||
					e?.user_id?.toString()?.toLowerCase()?.includes(word?.toLowerCase()) ||
					e?.permission_name?.toString()?.toLowerCase()?.includes(word?.toLowerCase())
			)
		)
	}

	useEffect(() => {
		fetchPermissions()
	}, [approvalStatus])

	const statusTag = (status) => {
		if (status === "Y") return <Tag color="green">Approved</Tag>
		if (status === "R") return <Tag color="red">Rejected</Tag>
		return <Tag color="orange">Pending</Tag>
	}

	return (
		<div>
			<Spin
				indicator={<LoadingOutlined spin />}
				size="large"
				className="text-slate-800 dark:text-gray-400"
				spinning={loading}
			>
				<main className="px-4 h-auto my-10 mx-32">
					{/* Status Filter */}
					<Radiobtn
						data={options_status}
						val={approvalStatus}
						onChangeVal={(value) => {
							setApprovalStatus(value)
						}}
					/>

					{/* Search + Title Bar */}
					<motion.section
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.5, type: "spring", stiffness: 30 }}
					>
						<div
							className={`flex flex-col bg-slate-800
							 rounded-lg my-3 dark:bg-slate-800
							 md:flex-row items-center justify-between space-y-3 md:space-y-0 md:space-x-4 p-1.5`}
						>
							<div className="w-full flex flex-row-reverse justify-between items-center mx-4">
								<div className="relative w-full">
									<div className="absolute inset-y-0 left-0 flex items-center md:ml-4 pl-3 pointer-events-none">
										<svg
											aria-hidden="true"
											className="w-5 h-5 text-gray-500 dark:text-gray-400"
											fill="currentColor"
											viewBox="0 0 20 20"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												fillRule="evenodd"
												d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
												clipRule="evenodd"
											/>
										</svg>
									</div>
									<motion.input
										type="text"
										id="simple-search"
										initial={{ opacity: 0, width: 0 }}
										animate={{ opacity: 1, width: "95%" }}
										transition={{ delay: 1.1, type: "just" }}
										className={`bg-white border rounded-lg border-slate-700 bg-slate-300
										 text-gray-800 block w-full h-12 pl-10 dark:bg-gray-800 md:ml-4 duration-300 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white text-lg`}
										placeholder="Search by User ID, User Name or Permission"
										onChange={(text) => setSearch(text.target.value)}
									/>
								</div>

								<motion.h2
									initial={{ opacity: 0, y: -50 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 1, type: "just" }}
									className="text-xl capitalize text-nowrap font-bold text-white dark:text-white sm:block hidden mx-4"
								>
									Approve Permission
								</motion.h2>
							</div>
						</div>
					</motion.section>

					{/* Table */}
					<motion.section
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.5, type: "spring", stiffness: 30 }}
					>
						<table className="w-full text-sm text-left rtl:text-right shadow-lg text-gray-700 dark:text-gray-400">
							<thead className="text-md text-gray-700 capitalize bg-slate-300 dark:bg-gray-700 dark:text-gray-400">
								<tr>
									<th scope="col" className="p-4">#</th>
									<th scope="col" className="p-4">User ID</th>
									<th scope="col" className="p-4">User Name</th>
									<th scope="col" className="p-4">Permission</th>
									<th scope="col" className="p-4">Requested On</th>
									<th scope="col" className="p-4">Status</th>
									<th scope="col" className="p-4">Action</th>
								</tr>
							</thead>
							<tbody>
								{permissionList && permissionList.length > 0 ? (
									permissionList.slice(first, rows + first).map((item, i) => (
										<tr
											key={i}
											className="bg-white border-b-pink-200 border-2 dark:bg-gray-800 dark:border-gray-700"
										>
											<td className="px-4 py-3 font-semibold text-slate-800">
												{first + i + 1}
											</td>
											<td className="px-4 py-3 font-semibold text-slate-800">
												{item?.user_id || "-"}
											</td>
											<td className="px-4 py-3 text-slate-700">
												{item?.user_name || "-"}
											</td>
											<td className="px-4 py-3 text-slate-700">
												{item?.permission_name || item?.module_name || "-"}
											</td>
											<td className="px-4 py-3 text-slate-700">
												{item?.created_at
													? new Date(item.created_at).toLocaleDateString("en-IN")
													: "-"}
											</td>
											<td className="px-4 py-3">
												{statusTag(item?.approval_status)}
											</td>
											<td className="px-4 py-3">
												{item?.approval_status === "N" ? (
													<div className="flex gap-2">
														<Popconfirm
															title="Approve Permission"
															description="Are you sure you want to approve this permission?"
															onConfirm={() => handleApproveReject(item, "Y")}
															okText="Yes, Approve"
															cancelText="No"
															okButtonProps={{ style: { background: "#22543d", borderColor: "#22543d" } }}
														>
															<Tooltip title="Approve">
																<button className="bg-green-100 hover:bg-green-200 text-green-700 font-semibold px-3 py-1.5 rounded-full transition-all duration-200">
																	<CheckCircleOutlined className="text-lg" />
																</button>
															</Tooltip>
														</Popconfirm>

														<Popconfirm
															title="Reject Permission"
															description="Are you sure you want to reject this permission?"
															onConfirm={() => handleApproveReject(item, "R")}
															okText="Yes, Reject"
															cancelText="No"
															okButtonProps={{ danger: true }}
														>
															<Tooltip title="Reject">
																<button className="bg-red-100 hover:bg-red-200 text-red-600 font-semibold px-3 py-1.5 rounded-full transition-all duration-200">
																	<CloseCircleOutlined className="text-lg" />
																</button>
															</Tooltip>
														</Popconfirm>
													</div>
												) : (
													<span className="text-gray-400 text-xs italic">No action available</span>
												)}
											</td>
										</tr>
									))
								) : (
									<tr className="bg-white border-b-pink-200 border-2 dark:bg-gray-800 dark:border-gray-700">
										<td colSpan={7} className="text-center p-5">
											<p className="m-0 text-center text-lg">No Data Found</p>
										</td>
									</tr>
								)}
							</tbody>
						</table>

						<Paginator
							first={first}
							rows={rows}
							totalRecords={permissionList?.length}
							rowsPerPageOptions={[5, 10, 15, 20, 30, permissionList?.length]}
							onPageChange={onPageChange}
						/>
					</motion.section>
				</main>
			</Spin>
		</div>
	)
}

export default ApprovePermission

