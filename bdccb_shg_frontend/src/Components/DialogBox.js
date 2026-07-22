import { useContext, useEffect, useState } from "react"
import { Dialog } from "primereact/dialog"
import { useNavigate } from "react-router-dom"
import { Spin, Tabs } from "antd"
import PasswordComp from "./PasswordComp"
import "../Styles/styles.css"
import UserProfileUpdateForm from "../Screens/Forms/UserProfileUpdateForm"
import {  loadingContext } from "../Context/Democontext"
import { routePaths } from "../Assets/Data/Routes"
import { LoadingOutlined } from "@ant-design/icons"

const DialogBox = ({
	visible,
	flag,
	onPress,
	data,
	onPressNo,
	onPressYes,
	onEditPress,
	loading=false
}) => {
	const { handleLogOut } = useContext(loadingContext)
	const navigate = useNavigate()
	const [po_no, setPoNo] = useState("")
	console.log(data)
	useEffect(() => {
		setPoNo("")
	}, [])
	const onChange = (key) => {
		console.log(key, "onChange")
	}
	const itemsComp = [
		{
			key: "1",
			label: "User profile",
			children: (
				<>
					{/* <ProfileInfo flag={flag} /> */}

					<UserProfileUpdateForm onClose={onPress} />

					{/* <Button
						className="rounded-full bg-blue-800 text-white mt-10 float-right"
						onClick={() => onEditPress()}
						icon={<EditOutlined />}
					></Button> */}
				</>
			),
		},
		{
			key: "2",
			label: "Change password",
			children: <PasswordComp mode={2} onPress={onPress} />,
		},
	]

	return (
		<Dialog
			closable={flag != 3 ? true : false}
			header={
				<div
					className={
						flag != 1
							? "text-slate-800  font-bold"
							: "text-slate-800  font-bold w-20"
					}
				>
					{flag != 2 &&
						flag != 5 &&
						flag != 6 &&
						flag != 7 &&
						flag != 8 &&
						flag != 9 &&
						flag != 10 &&
						flag != 11
						? "Warning!"
						: flag != 10
							? "Information"
							: "Preview"}
				</div>
			}
			visible={visible}
			maximizable
			style={{
				width: "50vw",
				background: "black",
			}}
			onHide={() => {
				if (!visible) return
				onPress()
			}}
		>
			{flag == 1 && (
				<p className="m-0">
					Do you want to logout?
					<div className="flex justify-center">
						<button
							type="reset"
							onClick={onPress}
							className="inline-flex mr-3 bg-slate-800 items-center px-5 py-2.5 mt-4 sm:mt-6 text-sm font-medium text-center text-white border border-slate-800 bg-primary-700 rounded-full focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-900 hover:bg-primary-800"
						>
							No
						</button>
						<button
							type="submit"
							onClick={async () => {
								await handleLogOut().then(() => {
									navigate(routePaths.LANDING)
								})
							}}
							className="inline-flex bg-[#DA4167] items-center px-5 py-2.5 mt-4 sm:mt-6 text-sm font-medium text-center text-white rounded-full focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-900 hover:bg-primary-800"
						>
							Yes
						</button>
					</div>
				</p>
			)}
			{flag == 2 && (
				<Tabs
					defaultActiveKey="1"
					size={"large"}
					animated
					centered
					items={itemsComp}
					onChange={onChange}
				/>
			)}
			{flag == 3 && <PasswordComp mode={3} onPress={onPress} />}
			{flag == 4 && (
				<Spin
					indicator={<LoadingOutlined spin={true} />}
					size="large"
					className="text-blue-800 dark:text-gray-400"
					spinning={loading}
				>
				<p className="m-0">
					Are you sure? This action cannot be undone.
					<div className="flex justify-center">
						<button
							type="button"
							onClick={onPressNo}
							className="inline-flex mr-3 bg-slate-800 items-center px-5 py-2.5 mt-4 sm:mt-6 text-sm font-medium text-center text-white border border-slate-800 bg-primary-700 rounded-full focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-900 hover:bg-primary-800"
						>
							No
						</button>
						<button
							type="button"
							onClick={onPressYes}
							className="inline-flex bg-[#DA4167] items-center px-5 py-2.5 mt-4 sm:mt-6 text-sm font-medium text-center text-white rounded-full focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-900 hover:bg-primary-800"
						>
							Yes
						</button>
					</div>
				</p>
				</Spin>
			)}
			{flag == 5 && (
				<p className="m-0">
					Group with code:{data} is created!
					<div className="flex justify-center">
						<button
							type="button"
							onClick={onPressYes}
							className="inline-flex bg-[#DA4167] items-center px-5 py-2.5 mt-4 sm:mt-6 text-sm font-medium text-center text-white rounded-full focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-900 hover:bg-primary-800"
						>
							OK
						</button>
					</div>
				</p>
			)}
			{flag == 6 && (
				<p className="m-0">
					An active session detected! This action will log you out from the
					active session. Do you want to log in anyways?
					<div className="flex justify-center">
						<button
							type="button"
							onClick={onPressNo}
							className="inline-flex mr-3 bg-slate-800 items-center px-5 py-2.5 mt-4 sm:mt-6 text-sm font-medium text-center text-white border border-slate-800 bg-primary-700 rounded-full focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-900 hover:bg-primary-800"
						>
							No
						</button>
						<button
							type="button"
							onClick={onPressYes}
							className="inline-flex bg-[#DA4167] items-center px-5 py-2.5 mt-4 sm:mt-6 text-sm font-medium text-center text-white rounded-full focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-900 hover:bg-primary-800"
						>
							Yes
						</button>
					</div>
				</p>
			)}
			{flag==7 && <div>

<div class="relative overflow-x-auto bg-neutral-primary-soft shadow-xs rounded-base border border-default">
    <table class="w-full text-sm text-left rtl:text-right text-body">
        <thead class="text-sm text-body bg-neutral-secondary-soft bg-gray-900 border-b rounded-base border-default">
            <tr>
                <th scope="col" class="px-6 py-3 text-white font-medium">
                   Member Code
                </th>
				<th scope="col" class="px-6 py-3 text-white font-medium">
                   Member Name
                </th>
				<th scope="col" class="px-6 py-3 text-white font-medium">
                   Gender
                </th>
				<th scope="col" class="px-6 py-3 text-white font-medium">
                   Caste
                </th>
				<th scope="col" class="px-6 py-3 text-white font-medium">
                   Account No.
                </th>
                <th scope="col" class="px-6 py-3 text-white font-medium">
                    Aadhar No.
                </th>
				<th scope="col" class="px-6 py-3 text-white font-medium">
                    IFSC
                </th>
				<th scope="col" class="px-6 py-3 text-white font-medium">
                    Guardian
                </th>
                <th scope="col" class="px-6 py-3 text-white font-medium">
                    Address
                </th>
				<th scope="col" class="px-6 py-3 text-white font-medium">
                    Phone No.
                </th>
                <th scope="col" class="px-6 py-3 text-white font-medium">
                    Group Designation
                </th>
                <th scope="col" class="px-6 py-3 text-white font-medium">
                    Religion
                </th>
            </tr>
        </thead>
        <tbody>
            {data?.map(item=>
				<tr class="bg-neutral-primary border-b border-default">
                <th scope="row" class="px-6 py-4 font-medium text-heading whitespace-nowrap">
                    {item?.member_code}
                </th>
                <td class="px-6 py-4">
                    {item?.member_name}
                </td>
				 <td class="px-6 py-4">
                    {item?.gender=='M'?'Male':'Female'}
                </td>
				<td class="px-6 py-4">
                    {item?.caste}
                </td>
                <td class="px-6 py-4">
                   {item?.member_account_no}
                </td>
                <td class="px-6 py-4">
                   {item?.aadhar_no}

                </td>
                <td class="px-6 py-4">
                    {item?.ifsc}
                </td>
				 <td class="px-6 py-4">
                    {item?.gurdian_name}
                </td>
				 <td class="px-6 py-4">
                    {item?.address}
                </td>
				
				<td class="px-6 py-4">
                    {item?.phone_no}
                </td>
				<td class="px-6 py-4">
                    {item?.gp_leader_flag=='Y'?'Leader':item?.asst_gp_leader_flag=='Y'?'Asst. Leader':'Member'}
                </td>
				<td class="px-6 py-4">
                    {item?.religion}
                </td>
            </tr>
		
		)}
         
        </tbody>
    </table>
</div>
</div>}
		</Dialog>
	)
}

export default DialogBox
