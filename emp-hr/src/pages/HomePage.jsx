import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';

function HomePage() {
  return (
   <div className="fixed mt-2 left-0 w-full ">
<div className=" flex pl-[130px] flex-row items-center justify-between w-full bg-[#051b56bf] p-3 text-white">
  <div className='flex flex-col items-start'>

  <h1>Welcome, Divya!</h1>
  <p>May your orbit be steady and your stars aligned.</p>
  </div>
  <div className='flex flex-col items-start pr-4'>
    <p>Monday, 12 Aug</p>
  <button className="bg-[#e96101] w-full  m-2 pl-5 pr-5 pt-2 pb-2 rounded-lg"><LoginOutlinedIcon/> Check In</button>
  <p>Last Punch Time, 12:00 PM </p>
  </div>

</div>
</div>
   
  );
}

export default HomePage;
