import { Component, OnInit, ViewChild } from "@angular/core";
import { HttpClient, HttpResponse, HttpHeaders } from "@angular/common/http";
import { DataTableDirective } from "angular-datatables";
import { environment } from "../../../environments/environment";
import { BmsapiService } from "../../providers/bmsapi.service";
import { Router } from "@angular/router";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import {
  FormBuilder,
  FormGroup,
  FormControl,
  FormArray,
  Validators,
} from "@angular/forms";
import { DownloadingViewBmsComponent } from "../../modals/brokerage/downloading-view-bms/downloading-view-bms.component";

class ColumnsObj {
  Id: string;
  isSelected: any;
  Agent_Id: any;
  Add_Stamp: string;
  Agent_Name: string;
  RM_Name: string;
}
class DataTablesResponse {
  data: any[];
  draw: number;
  recordsFiltered: number;
  recordsTotal: number;
  PostingCountAr: any;
  SQL_Where: any;
}

@Component({
  selector: "app-po-statement",
  templateUrl: "./po-statement.component.html",
  styleUrls: ["./po-statement.component.css"],
})
export class PoStatementComponent implements OnInit {
  @ViewChild(DataTableDirective, { static: false })
  datatableElement: DataTableDirective;

  dtOptions: DataTables.Settings = {};
  dataAr: ColumnsObj[];

  TotalPendingForPosting: number = 0;
  TotalPendingForAccounts: number = 0;
  TotalRejectByAccounts: number = 0;
  TotalPendingForBanking: number = 0;
  TotalRejectByBanking: number = 0;
  TotalApproved: number = 0;
  TotalPaid: number = 0;

  ActivePage: string = "Default";

  SearchForm: FormGroup;
  isSubmitted = false;

  Vertical_Ar: Array<any>;
  Region_Ar: Array<any>;
  Sub_Branch_Ar: Array<any>;
  Emps_Ar: Array<any>;
  Agents_Ar: Array<any>;
  Companies_Ar: Array<any>;
  Products_Ar: Array<any>;
  AccountsUser_Ar: Array<any>;
  Payout_Mode_Ar: Array<any>;
  MonthsYear_Ar: any = [];

  SRAgentType_Ar: any = [];
  SRLOB_Ar: any = [];
  SRStatus_Ar: any = [];
  SRType_Ar: any = [];
  SRSource_Ar: any = [];
  SR_Payout_Status_Ar: any = [];

  vertical_dropdownSettings: any = {};
  dropdownSettings: any = {};

  AgentdropdownSettings: any = {};
  LOB_dropdownSettings: any = {};

  ItemVerticalSelection: any = [];
  ItemEmployeeSelection: any = [];
  ItemLOBSelection: any = [];

  Employee_Placeholder: any = "Select Employee";
  Agents_Placeholder: any = "Select POS";

  DisableNextMonth: any;

  Assign_User: any = "";
  Remark: any = "";

  AdditonalCCEmail: any = "";

  masterSelected: boolean;
  checklist: any = [];
  checkedList: any = [];

  maxDate = new Date();
  minDate = new Date();

  CurrentYear: any;

  SQL_Where_STR: any;
  Is_Export: any = 0;

  Payout_Mode: any;

  constructor(
    public api: BmsapiService,
    private http: HttpClient,
    public dialog: MatDialog,
    private router: Router,
    private fb: FormBuilder
  ) {
    var d = new Date();
    this.CurrentYear = d.getFullYear();
    //alert(this.CurrentYear);

    this.SearchForm = this.fb.group({
      Vertical_Id: ["0"],
      Region_Id: ["0"],
      Sub_Region_Id: ["0"],
      Emp_Id: [""],
      SRAgent_Type: [""],
      Agent_Id: [""],
      Payout_Mode: ["", [Validators.required]],
      Year: [this.CurrentYear, [Validators.required]],
      From_Month: ["", [Validators.required]],
      To_Month: ["", [Validators.required]],
    });

    this.dropdownSettings = {
      singleSelection: false,
      idField: "Id",
      textField: "Name",
      //selectAllText: 'Select All',
      //unSelectAllText: 'UnSelect All',
      itemsShowLimit: 1,
      enableCheckAll: false,
      allowSearchFilter: true,
    };

    this.AgentdropdownSettings = {
      singleSelection: false,
      idField: "Id",
      textField: "Name",
      selectAllText: "Select All",
      unSelectAllText: "UnSelect All",
      itemsShowLimit: 2,
      enableCheckAll: true,
      allowSearchFilter: true,
    };

    this.LOB_dropdownSettings = {
      singleSelection: false,
      enableCheckAll: false,
      idField: "Id",
      textField: "Name",
    };

    this.Payout_Mode_Ar = [
      { Id: "Advance", Name: "Advance" },
      { Id: "Weekly", Name: "Weekly" },
      { Id: "Monthly", Name: "Monthly" },
    ];
    this.SR_Payout_Status_Ar = [
      { Id: "0", Name: "PendingForPosting" },
      { Id: "1", Name: "PendingForAccounts" },
      { Id: "2", Name: "RejectByAccounts" },
      { Id: "3", Name: "PendingForBanking" },
      { Id: "4", Name: "RejectByBanking" },
      { Id: "5", Name: "Approved" },
      { Id: "6", Name: "Paid/PayoutTransferred" },
    ];

    //this.DisableNextMonth = new Date();

    this.minDate.setDate(this.minDate.setFullYear(2001));
    this.maxDate.setDate(this.maxDate.getDate() - this.maxDate.getDate());
  }

  ngOnInit(): void {
    this.Get();
    this.FilterData();
  }

  get FC() {
    return this.SearchForm.controls;
  }

  FilterData() {
    this.api.IsLoading();
    this.api
      .Call(
        "sr/Agent/SearchComponentsData?request_page=PO-Statment&Role=" +
          this.api.GetUserData("User_Role") +
          "&User_Id=" +
          this.api.GetUserId()
      )
      .then(
        (result) => {
          this.api.HideLoading();
          if (result["Status"] == true) {
            this.Vertical_Ar = result["Data"]["Vertical"];
            //this.Emps_Ar = result['Data']['Hierarchy']['Employee'];
            this.Companies_Ar = result["Data"]["Ins_Compaines"];
            //this.Products_Ar = result['Data']['Products_Ar'];
            this.Region_Ar = result["Data"]["Region_Ar"];
            this.AccountsUser_Ar = result["Data"]["AccountsUser"];
            this.MonthsYear_Ar = result["Data"]["MonthsYear_Ar"];
          } else {
            //alert(result['Message']);
          }
        },
        (err) => {
          // Error log
          this.api.HideLoading();

          //alert(err.message);
        }
      );
  }

  onItemSelect(item: any, Type: any) {
    // console.log('Type : '+ Type);
    // console.log('onItemSelect', item);

    if (Type == "Vertical") {
      this.Emps_Ar = [];
      this.Agents_Ar = [];

      this.ItemVerticalSelection.push(item.Id);
      // console.log(this.ItemVerticalSelection);
      //this.GetEmployees('OneByOneSelect');
    }

    if (Type == "Employee") {
      this.Agents_Ar = [];

      this.ItemEmployeeSelection.push(item.Id);
      // console.log(this.ItemEmployeeSelection);
      this.GetAgents("OneByOneSelect");
    }
  }

  onItemDeSelect(item: any, Type: any) {
    // console.log('Type : '+ Type);
    // console.log('onDeSelect', item);

    if (Type == "Vertical") {
      this.Emps_Ar = [];
      this.Agents_Ar = [];

      var index = this.ItemVerticalSelection.indexOf(item.Id);
      if (index > -1) {
        this.ItemVerticalSelection.splice(index, 1);
      }
      // console.log(this.ItemVerticalSelection);
      //this.GetEmployees('OneByOneDeSelect');
    }

    if (Type == "Employee") {
      this.Agents_Ar = [];

      var index = this.ItemEmployeeSelection.indexOf(item.Id);
      if (index > -1) {
        this.ItemEmployeeSelection.splice(index, 1);
      }
      // console.log(this.ItemEmployeeSelection);
      this.GetAgents("OneByOneDeSelect");
    }
  }

  GetEmployees() {
    this.Emps_Ar = [];
    this.Agents_Ar = [];

    this.SearchForm.get("Emp_Id").setValue(null);
    this.SearchForm.get("Agent_Id").setValue(null);

    const formData = new FormData();
    formData.append("User_Id", this.api.GetUserId());
    //formData.append('Type',Type);
    formData.append("Vertical_Id", this.SearchForm.value["Vertical_Id"]);
    formData.append("Region_Id", this.SearchForm.value["Region_Id"]);
    formData.append("Sub_Region_Id", this.SearchForm.value["Sub_Region_Id"]);

    this.api.HttpPostType("sr/AgentTest/GetEmployees", formData).then(
      (result) => {
        if (result["Status"] == true) {
          this.Emps_Ar = result["Data"];
          this.Employee_Placeholder =
            "Select Employee (" + this.Emps_Ar.length + ")";
          this.Agents_Placeholder = "Select Agent";
        } else {
          this.api.ErrorMsg(result["Message"]);
        }
      },
      (err) => {
        this.api.ErrorMsg("Network Error, Please try again ! " + err.message);
      }
    );
  }

  GetSubBranches(e) {
    this.GetEmployees();

    this.SearchForm.get("Sub_Region_Id").setValue("0");

    var Branch_Id = e.target.value;

    this.api.IsLoading();
    this.api
      .Call(
        "reports/AdminSrReport/GetSubBranches?Branch_Id=" +
          Branch_Id +
          "&User_Id=" +
          this.api.GetUserId()
      )
      .then(
        (result) => {
          this.api.HideLoading();
          if (result["Status"] == true) {
            this.Sub_Branch_Ar = result["Data"];
          } else {
            //alert(result['Message']);
          }
        },
        (err) => {
          // Error log
          this.api.HideLoading();

          //alert(err.message);
        }
      );
  }

  GetAgents(Type) {
    const formData = new FormData();
    formData.append("Type", Type);
    formData.append("RM_Ids", this.ItemEmployeeSelection.join());
    this.api.HttpPostType("sr/AgentTest/GetAgents", formData).then(
      (result) => {
        if (result["Status"] == true) {
          this.Agents_Ar = result["Data"];
          this.Agents_Placeholder =
            "Select Agents (" + this.Agents_Ar.length + ")";
        } else {
          this.api.ErrorMsg(result["Message"]);
        }
      },
      (err) => {
        this.api.ErrorMsg("Network Error, Please try again ! " + err.message);
      }
    );
  }

  SearchBtn() {
    this.isSubmitted = true;
    if (this.SearchForm.invalid) {
      return;
    } else {
      //// console.log(this.SearchForm.value);

      var fields = this.SearchForm.value;

      var DateOrDateRange = fields["DateOrDateRange"];
      var ToDate, FromDate;
      if (DateOrDateRange) {
        ToDate = DateOrDateRange[0];
        FromDate = DateOrDateRange[1];
      }

      var query = {
        User_Id: this.api.GetUserId(),

        Vertical_Id: fields["Vertical_Id"],
        Region_Id: fields["Region_Id"],
        Sub_Region_Id: fields["Sub_Region_Id"],

        Emp_Id: fields["Emp_Id"],
        SRAgent_Type: fields["SRAgent_Type"],
        Agent_Id: fields["Agent_Id"],

        Payout_Mode: fields["Payout_Mode"],
        Year: fields["Year"],
        From_Month: fields["From_Month"],
        To_Month: fields["To_Month"],
      };

      // console.log(query);

      this.Is_Export = 0;
      this.dataAr = [];
      this.datatableElement.dtInstance.then((dtInstance: DataTables.Api) => {
        dtInstance
          .column(0)
          .search(this.api.encryptText(JSON.stringify(query)))
          .draw();
        //this.Is_Export = 1;
      });
    }
  }

  ClearSearch() {
    var fields = this.SearchForm.reset();

    this.SearchForm.get("Vertical_Id").setValue("0");
    this.SearchForm.get("Region_Id").setValue("0");
    this.SearchForm.get("Sub_Region_Id").setValue("0");

    this.SearchForm.get("Year").setValue(this.CurrentYear);
    this.SearchForm.get("From_Month").setValue("");
    this.SearchForm.get("To_Month").setValue("");

    this.Emps_Ar = [];
    this.Agents_Ar = [];
    this.Products_Ar = [];

    this.Employee_Placeholder = "Select Employee";
    this.Agents_Placeholder = "Select Agent";

    this.ItemVerticalSelection = [];
    this.ItemEmployeeSelection = [];
    this.ItemLOBSelection = [];

    this.dataAr = [];
    this.ResetDT();

    this.Is_Export = 0;

    //this.TotalNetPremium = 0.00;
    //this.TotalSR = 0;
  }

  Reload() {
    this.datatableElement.dtInstance.then((dtInstance: DataTables.Api) => {
      dtInstance.draw();
    });
  }
  ResetDT() {
    this.datatableElement.dtInstance.then((dtInstance: DataTables.Api) => {
      dtInstance.search("").column(0).search("").draw();
    });
  }

  Get() {
    const that = this;

    this.dtOptions = {
      pagingType: "full_numbers",
      pageLength: 10,
      serverSide: true,
      processing: true,
      ajax: (dataTablesParameters: any, callback) => {
        that.http
          .post<DataTablesResponse>(
            this.api.additionParmsEnc(
              environment.apiUrlBmsBase +
                "/brokerage/PO_Statement/GridData?User_Id=" +
                this.api.GetUserId() +
                "&source=crm"
            ),
            dataTablesParameters,
            this.api.getHeader(environment.apiUrlBmsBase)
          )
          .subscribe((res: any) => {
            var resp = JSON.parse(this.api.decryptText(res.response));
            that.dataAr = resp.data;

            that.SQL_Where_STR = resp.SQL_Where;
            if (that.dataAr.length > 0) {
              that.Is_Export = 1;
            }

            callback({
              recordsTotal: resp.recordsTotal,
              recordsFiltered: resp.recordsFiltered,
              data: [],
            });
          });
      },
      //columns: [
      //		{ data: 'Id' },
      //		{ data: 'Type' }

      //]

      columnDefs: [
        {
          targets: [0, 1, 2, 3, 4, 5, 6, 7], // column index (start from 0)
          orderable: false, // set orderable false for selected columns
        },
      ],
    };
  }

  ExportExcel(): void {
    //// console.log(this.SQL_Where_STR);
    const dialogConfig = new MatDialogConfig();
    // console.log(dialogConfig);

    //dialogConfig.disableClose = true;
    //dialogConfig.autoFocus = false;
    dialogConfig.width = "25%";
    dialogConfig.height = "14%";
    //dialogConfig.position = 'absolute';
    dialogConfig.hasBackdrop = false;
    //dialogConfig.closeOnNavigation = false;

    dialogConfig.position = {
      top: "40%",
      left: "1%",
    };

    dialogConfig.data = {
      ReportType: "PayoutRequest",
      SQL_Where: this.SQL_Where_STR,
    };

    this.Is_Export = 0;

    const dialogRef = this.dialog.open(
      DownloadingViewBmsComponent,
      dialogConfig
    );

    dialogRef.afterClosed().subscribe((result: any) => {
      // console.log(result);
    });
  }

  checkUncheckAll() {
    for (var i = 0; i < this.dataAr.length; i++) {
      this.dataAr[i].isSelected = this.masterSelected;
    }
    this.getCheckedItemList();
  }
  isAllSelected() {
    this.masterSelected = this.dataAr.every(function (item: any) {
      return item.isSelected == true;
    });
    this.getCheckedItemList();
  }

  getCheckedItemList() {
    this.checkedList = [];
    for (var i = 0; i < this.dataAr.length; i++) {
      if (this.dataAr[i].isSelected)
        this.checkedList.push({
          Id: this.dataAr[i].Id,
          Agent_Id: this.dataAr[i].Agent_Id,
        });
    }
    //this.checkedList = JSON.stringify(this.checkedList);
    this.checkedList = this.checkedList;
    // console.log(this.checkedList);
  }

  Cancel() {
    this.Reload();
    this.masterSelected = false;
    this.checkedList = [];
  }

  SendStatement() {
    var Is_Confirm = "Are you sure that you want to change status this data?";

    if (confirm(Is_Confirm) == true) {
      var fields = this.SearchForm.value;

      const formData = new FormData();

      formData.append("User_Id", this.api.GetUserId());

      formData.append("AdditonalCCEmail", this.AdditonalCCEmail);
      formData.append("Year", fields["Year"]);
      formData.append("From_Month", fields["From_Month"]);
      formData.append("To_Month", fields["To_Month"]);

      formData.append("checkedList", JSON.stringify(this.checkedList));

      for (var i = 0; i < this.checkedList.length; i++) {
        //formData.append('Posting_Ids[]', this.checkedList[i]['Id'] );
        formData.append("Agent_Ids[]", this.checkedList[i]["Agent_Id"]);
      }

      this.api.IsLoading();
      this.api
        .HttpPostType("brokerage/PO_Statement/SendStatementOnMail", formData)
        .then(
          (result) => {
            this.api.HideLoading();

            if (result["Status"] == true) {
              this.Reload();
              this.masterSelected = false;
              this.checkedList = [];
              this.api.ToastMessage(result["Message"]);
            } else {
              this.api.ErrorMsg(result["Message"]);
            }
          },
          (err) => {
            // Error log
            this.api.HideLoading();
            //// console.log(err.message);
            this.api.ErrorMsg(
              "Network Error, Please try again ! " + err.message
            );
          }
        );
    } else {
      this.Reload();
      this.masterSelected = false;
      this.checkedList = [];
    }
  }
}
