import { api, LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import handleAttendance from '@salesforce/apex/MainApex.handleAttendance';
import cosistentItems from '@salesforce/apex/MainApex.cosistentItems';

export default class EmployeeComponent extends LightningElement {    
    @track todayDate = '';
    @track currentTime = '';
    @track totalTime = '';

    @track punchOutClicked = '';
    @track WFHClicked = '';
    
    @track punchInHours = '';
    @track punchInMinutes = '';
    @track punchInseconds = '';

    @track punchOutHours = '';
    @track punchOutMinutes = '';
    @track punchOutseconds = '';

    @track punchInTime;
    @track punchOutTime;

    @track isPunchInDisabled = false;
    @track isPunchOutDisabled = true;
    @track isWFHDisabled = false;

    @track punchInNow;
    @track punchOutNow;
  
    connectedCallback() {
        cosistentItems()
            .then(response => {
                if (response.punchIn) {
                    this.isPunchInDisabled = true;
                    this.isPunchOutDisabled = false;
                    this.isWFHDisabled = true;

                    const punchInvalue = new Date(response.punchIn);

                    this.punchInTime = this.formatTime(punchInvalue);   
                }
                if (response.punchOut) {
                    this.isPunchOutDisabled = true;
                    this.isPunchInDisabled = true;
                    this.isWFHDisabled = true;

                    const punchOutvalue = new Date(response.punchOut);
                    const punchInvalue = new Date(response.punchIn);
                    
                    this.punchOutTime = this.formatTime(punchOutvalue);

                    this.totalTimeUpdate(punchOutvalue, punchInvalue);
                }
            });

        const today = new Date();
        this.todayDate = today.toLocaleDateString();
        this.currentTime;
        this.intervalId = setInterval(() => {
            this.updateTime();
        }, 1000);
    }

    disconnectedCallback() {
        clearInterval(this.intervalId);
    }

    updateTime() {
        const now = new Date();

        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        this.currentTime = `${hours}:${minutes}:${seconds}`;   
    }
    
    punchInTimeUpdate(){
        const punchInNow = new Date();

        const punchInhours = String(punchInNow.getHours()).padStart(2, '0');
        const punchInminutes = String(punchInNow.getMinutes()).padStart(2, '0');
        const punchInseconds = String(punchInNow.getSeconds()).padStart(2, '0');
        
        this.punchInTime = `${punchInhours}:${punchInminutes}:${punchInseconds}`; 
    }

    punchOuttIimeUpdate(){
        const punchOutNow = new Date();

        const punchOuthours = String(punchOutNow.getHours()).padStart(2, '0');
        const punchOutminutes = String(punchOutNow.getMinutes()).padStart(2, '0');
        const punchOutseconds = String(punchOutNow.getSeconds()).padStart(2, '0');

        this.punchOutTime = `${punchOuthours}:${punchOutminutes}:${punchOutseconds}`;  
    }

    totalTimeUpdate(punchOut, punchIn){
        const totalTimeMil = punchOut - punchIn;
        
        const totalMinutes = Math.floor(totalTimeMil / (1000 * 60));
        const totalTimeHours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
        const totalTimeMinutes = String(totalMinutes % 60).padStart(2, '0');
        const totalTimeSeconds = String((Math.floor(totalTimeMil/1000))%60).padStart(2, '0');
        
        this.totalTime = `${totalTimeHours}:${totalTimeMinutes}:${totalTimeSeconds}`;   
    }

    handlePunchIn(){
        const punchInEvent = new ShowToastEvent({
            title: 'You are Punched In!',
            message:'You can not Punch In again, you can only Punch Out.',
            variant: 'success'
        });

        this.dispatchEvent(punchInEvent);

        this.isPunchInDisabled = true;
        this.isPunchOutDisabled = false;
        this.isWFHDisabled = true;

        this.punchInTimeUpdate();

        handleAttendance({punchOutClicked:false,WFHClicked:false});  
    }

    handlePunchOut(){
        const punchOutEvent = new ShowToastEvent({
            title: 'You are Punched Out!',
            message:'You can not Punch Out, or In untill tomorrow.',
            variant: 'success'
        });

        this.dispatchEvent(punchOutEvent);
        
        this.punchOuttIimeUpdate();

        handleAttendance({punchOutClicked:true,WFHClicked:false});
        console.log ('We are after the handleAttendance call.');

        this.isPunchOutDisabled = true;

        this.punchOutClicked = true;
    }

    handleWFH(){
        handleAttendance({punchOutClicked:false,WFHClicked:true});

        console.log('We are after the handleAttendance call');

        const WFHEvent = new ShowToastEvent({
            title: 'You are Working From Home!',
            message:'You can not Punch In, Punch Out, or Work From Home till tomorrow.',
            variant: 'success'
        });
        this.dispatchEvent(WFHEvent);

        this.isWFHDisabled = true;
        this.isPunchInDisabled = true;
    }

    formatTime(Date){
       const hours = String(Date.getHours()).padStart(2, '0');
       const minutes = String(Date.getMinutes()).padStart(2, '0');
       const seconds = String(Date.getSeconds()).padStart(2, '0');
        
       let time = `${hours}:${minutes}:${seconds}`;
       return time;
    }
}