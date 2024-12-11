import { LightningElement, track } from 'lwc';
import getEmployeesByStatus from '@salesforce/apex/MainApex.getEmployeesByStatus';

export default class EmployeeViews extends LightningElement {

    @track presentEmployees = [];
    @track absentEmployees = [];
    @track workingFromHomeEmployees = [];

    selectedView = 'present';
    isDropdownOpen = false;

    viewLabels = {
        present: 'Present Employees',
        absent: 'Absent Employees',
        workingFromHome: 'Working From Home Employees',
    };

    connectedCallback() {
        this.fetchEmployees('Present', 'presentEmployees');
        this.fetchEmployees('Absent', 'absentEmployees');
        this.fetchEmployees('Working From Home', 'workingFromHomeEmployees');
    }

    get selectedViewLabel() {
        return this.viewLabels[this.selectedView];
    }

    toggleDropdown() {
        this.isDropdownOpen = !this.isDropdownOpen;
    }

    handleViewSelection(event) {
        this.selectedView = event.target.dataset.value;
        this.isDropdownOpen = false; 
    }

    get isPresentView() {
        return this.selectedView === 'present';
    }

    get isAbsentView() {
        return this.selectedView === 'absent';
    }

    get isWorkingFromHomeView() {
        return this.selectedView === 'workingFromHome';
    }

    fetchEmployees(status, listName) {
        getEmployeesByStatus({ status })
            .then((data) => {
                this[listName] = data;
                this.error = undefined;
            })
            .catch((error) => {
                this.error = error;
                this[listName] = [];
            });
    }
}
