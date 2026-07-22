import { Spin } from "antd";
import "../../Screens/BMHome/Dashboard/Dashboard.css";

export default function DashboardCard({
	titleLeft,
	titleLeftClass,
	titleRight = "",
	titleRightClass,
	left1Data,
	left2Data,
	left3Data,
	right1Data,
	right2Data,
	right3Data,
	leftColor = "#000000",
	rightColor = "#000000",
	loading = false,
}) {
	return (
		<div className="col-span-1 md:col-span-2 bg-white rounded-2xl shadow-md p-6">
			{/* Header Section */}
			<div className="flex justify-between">
				{titleLeft && (
					<h2 className={`font-medium text-slate-700 ${titleLeftClass || "text-xl"}`}>{titleLeft}</h2>
				)}
				{titleRight && (
					<h2 className={`font-medium text-slate-700 ${titleRightClass || "text-xl"}`}>{titleRight}</h2>
				)}
			</div>

			{/* Content Grid */}
			<div className="grid grid-cols-[1fr_auto_1fr] gap-4 mt-4 items-center text-slate-700">
				{/* --- Row 1 --- */}
				<div className="w-full text-left">
					<Spin spinning={loading}>
						<p className="text-sm">{left1Data.label}</p>
						<p className="text-2xl font-bold" style={{ color: leftColor }}>
							{left1Data.value}
						</p>
					</Spin>
				</div>
				<div className="h-full w-[2px] rounded bg-slate-200" />
				<div className="w-full text-right">
					<Spin spinning={loading}>
						<p className="text-sm">{right1Data.label}</p>
						<p className="text-2xl font-semibold" style={{ color: rightColor }}>
							{right1Data.value}
						</p>
					</Spin>
				</div>

				{left2Data && right2Data && (
  <>
    {/* Divider */}
    <div className="col-span-3 h-[2px] w-full rounded bg-slate-200" />

    {/* Row 2 */}
    <div className="w-full text-left">
      <Spin spinning={loading}>
        <p className="text-sm">{left2Data.label}</p>
        <p className="text-2xl font-bold" style={{ color: leftColor }}>
          {left2Data.value}
        </p>
      </Spin>
    </div>
    <div className="h-full w-[2px] rounded bg-slate-200" />
    <div className="w-full text-right">
      <Spin spinning={loading}>
        <p className="text-sm">{right2Data.label}</p>
        <p className="text-2xl font-semibold" style={{ color: rightColor }}>
          {right2Data.value}
        </p>
      </Spin>
    </div>
  </>
)}

				{/* Divider */}
				<div className="col-span-3 h-[2px] w-full rounded bg-slate-200" />

				{/* --- Row 3 --- */}
				{left3Data && right3Data && (
					<>
						<div className="w-full text-left">
							<Spin spinning={loading}>
								<p className="text-sm">{left3Data.label}</p>
								<p className="text-2xl font-bold" style={{ color: leftColor }}>
									{left3Data.value}
								</p>
							</Spin>
						</div>
						<div className="h-full w-[2px] rounded bg-slate-200" />
						<div className="w-full text-right">
							<Spin spinning={loading}>
								<p className="text-sm">{right3Data.label}</p>
								<p
									className="text-2xl font-semibold"
									style={{ color: rightColor }}
								>
									{right3Data.value}
								</p>
							</Spin>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
