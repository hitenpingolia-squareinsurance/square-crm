import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ViewChild,
  AfterViewInit,
  NgZone,
} from "@angular/core";
import { CdkVirtualScrollViewport } from "@angular/cdk/scrolling";
import { map, pairwise, filter, throttleTime } from "rxjs/operators";
import { HttpClient } from "@angular/common/http";
import { DataTableDirective } from "angular-datatables";
import { ApiService } from "../../providers/api.service";
import { Router } from "@angular/router";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { HealthRenewalActionComponent } from "src/app/modals/health-renewal-action/health-renewal-action.component";
import { HealthRenewalsTrackComponent } from "src/app/modals/health-renewals-track/health-renewals-track.component";

class ColumnsObj {
  Id: string;
  Emp_Id: string;
  Type: string;
  Name: string;
  Email: string;
  Mobile: string;
  RM_Name: string;
  Remark: string;
  Status: string;
  Update_Stamp: string;
}

class DataTablesResponse {
  Status: any;
  data: any[];
  draw: number;
  FilterData: any[];
  recordsFiltered: number;
  recordsTotal: number;
  SQL_Where: any;
  SQL_Where1: any;
}
@Component({
  selector: "app-health-installment-report",
  templateUrl: "./health-installment-report.component.html",
  styleUrls: ["./health-installment-report.component.css"],
})
export class HealthInstallmentReportComponent implements OnInit {
  @ViewChild(DataTableDirective, { static: false })
  datatableElement: DataTableDirective;
  @ViewChild("scroller", { static: false }) scroller: CdkVirtualScrollViewport;

  dtOptions: DataTables.Settings = {};
  dataAr: ColumnsObj[];

  urlSegment: any = "health-installment-report";
  ActivePage: string = "Default";
  ActiveTab: any = 1;

  SearchForm: FormGroup;
  isSubmitted = false;

  DisableMonthField = false;
  DisableStatusField = false;
  ReportTypeDisable = false;

  Vertical_Ar: Array<any>;
  Region_Ar: Array<any>;
  Emps_Ar: Array<any>;
  ReportTypeData: Array<any>;
  SelectedReportType: Array<any>;

  Agents_Ar: Array<any>;
  Companies_Ar: Array<any>;
  Year_Ar: Array<any>;
  Months_Ar: Array<any>;
  Status_Ar: Array<any>;
  RenewalPeriod_Ar: Array<any>;

  SRType_Ar: any = [];
  SRSource_Ar: any = [];

  dropdownSettingsmultiselect: {};
  dropdownSettingsmultiselect1: {};
  dropdownSettingsingleselect: {};
  dropdownSettingsingleselect1: {};

  Employee_Placeholder: any = "Select Employee";
  Agents_Placeholder: any = "Select POS";
  Remark: any = "";

  CurrentMonth: any = "";
  Name: any = "";
  SelectedYear: any = [];
  SelectedCurrentMonth: any = [];
  SelectedCurrentStatus: any = [];
  MonthRenewal: any = [];

  maxDate = new Date();
  minDate = new Date();

  SQL_Where_STR: any;
  dateRange: any;

  totalRecordsfiltered: number;
  TotalRow: number;
  filterData: string;
  AgentName: any;
  dataArNested: any;
  NestedPagesList: any;
  loading = false;

  post: Array<any> = [];
  responseData: any;
  pageNo: any = 1;

  AgentId: string;
  ShowProspectBtn: string = "Yes";
  active_tab: any = "1";
  show_spinner: any = "yes";
  re_hit: any = "yes";

  AddProspectCallBtn = "No";
  InteractionPurposeVal: any = "";
  FunctionName: any = "GetRMReportData";

  SqlWhere: any;

  MessageBody: string = "";
  lobList: string = "";
  currentUrl: string = "";
  loginType: string;

  constructor(
    public api: ApiService,
    private router: Router,
    private http: HttpClient,
    public dialog: MatDialog,
    private fb: FormBuilder,
    private ngZone: NgZone
  ) {
    this.SearchForm = this.fb.group({
      Financial_Year: ["", [Validators.required]],
      Business_Line_Id: [""],
      Vertical_Id: [""],
      Region_Id: [""],
      Emp_Id: [""],
      Report_Type: [""],
      Agent_Id: [""],
      Product_Id: [""],
      Company_Id: [""],
      SR_Source_Type: [""],
      SR_Type: [""],
      GlobalSearch: [""],
      DateOrDateRange: [""],
      Month_Name: ["", [Validators.required]],
      Status: ["", [Validators.required]],
    });

    this.dropdownSettingsmultiselect = {
      singleSelection: false,
      idField: "Id",
      textField: "Name",
      itemsShowLimit: 1,
      enableCheckAll: false,
      allowSearchFilter: true,
    };

    this.dropdownSettingsmultiselect1 = {
      singleSelection: false,
      idField: "Id",
      textField: "Name",
      itemsShowLimit: 1,
      enableCheckAll: false,
      allowSearchFilter: false,
    };

    this.dropdownSettingsingleselect = {
      singleSelection: true,
      idField: "Id",
      textField: "Name",
      itemsShowLimit: 1,
      enableCheckAll: false,
      allowSearchFilter: true,
    };

    this.dropdownSettingsingleselect1 = {
      singleSelection: true,
      idField: "Id",
      textField: "Name",
      itemsShowLimit: 1,
      enableCheckAll: false,
      allowSearchFilter: false,
    };

    this.loginType = this.api.GetUserType();

    this.ReportTypeData = [
      { Id: "Self", Name: "Self" },
      { Id: "Team", Name: "Team" },
    ];
    this.SelectedReportType = [{ Id: "Team", Name: "Team" }];
    this.SelectedCurrentStatus = [{ Id: "Due", Name: "Dues" }];
    this.SelectedYear = [{ Id: "2024", Name: "2024-2025" }];

    //Month Related Filter Values
    const d = new Date();
    this.CurrentMonth = d.getMonth();
    const month = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    //Month String Value
    this.Name = month[d.getMonth()];

    //Month Numeric Value
    this.CurrentMonth = +this.CurrentMonth + +1;
    if (this.CurrentMonth < 10) {
      this.CurrentMonth = "0" + this.CurrentMonth;
    }
    this.SelectedCurrentMonth = [{ Id: this.CurrentMonth, Name: this.Name }];
  }

  ngOnInit(): void {
    //Check Url Segment
    this.currentUrl = this.router.url;
    this.SearchComponentsData();
    this.SetActiveTab("1");
    this.FilterDataGetMonthRenewal();
    this.pageNo = 1;
  }

  ngAfterViewInit(): void {
    this.api.data1$.subscribe((data) => {
      this.post = [];
      this.pageNo = 1;
      this.scroller
        .elementScrolled()
        .pipe(
          map(() => this.scroller.measureScrollOffset("bottom")),
          pairwise(),
          filter(([y1, y2]) => y2 < y1 && y2 < 140),
          throttleTime(900)
        )
        .subscribe(() => {
          this.ngZone.run(() => {
            if (this.re_hit == "yes") {
              this.Get();
            }
          });
        });
    });
  }

  //===== FORM CONTROLS VALIDATION =====//
  get FC() {
    return this.SearchForm.controls;
  }

  //===== SET ACTIVE TAB =====//
  SetActiveTab(tab_value: any) {
    this.active_tab = "";
    this.post = [];
    this.pageNo = 1;
    this.active_tab = tab_value;
    this.SearchData();
  }

  //===== CLEAR SEARCH FORM =====//
  ClearSearch() {
    this.SearchForm.reset();
    this.SearchComponentsData();

    this.SearchForm.get("Financial_Year").setValue("");
    this.SearchForm.get("Vertical_Id").setValue("");
    this.SearchForm.get("Region_Id").setValue("");
    this.SearchForm.get("Emp_Id").setValue("");
    this.SearchForm.get("Report_Type").setValue("");
    this.SearchForm.get("Agent_Id").setValue("");
    this.SearchForm.get("Company_Id").setValue("");
    this.SearchForm.get("SR_Source_Type").setValue("");
    this.SearchForm.get("Month_Name").setValue("");
    this.SearchForm.get("DateOrDateRange").setValue("");
    this.SearchForm.get("GlobalSearch").setValue("");

    this.SelectedCurrentMonth = [{ Id: this.CurrentMonth, Name: this.Name }];
    this.SelectedReportType = [{ Id: "Team", Name: "Team" }];
    this.SelectedCurrentStatus = [{ Id: "Due", Name: "Dues" }];
    this.SelectedYear = [{ Id: "2024", Name: "2024-2025" }];

    this.Emps_Ar = [];
    this.Agents_Ar = [];

    this.Employee_Placeholder = "Select Employee";
    this.Agents_Placeholder = "Select Agent";

    this.dataAr = [];
    this.Reload();
  }

  //===== SEARCH DATATABLE DATA =====//
  SearchData() {
    this.isSubmitted = true;
    if (this.SearchForm.invalid) {
      return;
    } else {
      this.post = [];
      this.pageNo = 1;
      this.post = [];
      this.Get();
    }
  }

  //===== RESET DATATABLE =====//
  ResetDT() {
    this.post = [];
    this.pageNo = 1;
  }

  //===== RELOAD DATATABLE =====//
  Reload() {
    this.post = [];
    this.pageNo = 1;
    this.Get();
  }

  //===== GET DATATABLE DATA =====//
  Get() {
    this.re_hit = "no";
    this.show_spinner = "yes";
    var fields = this.SearchForm.value;

    var DateOrDateRange = fields["DateOrDateRange"];
    var ToDate: any = "";
    var FromDate: any = "";
    if (DateOrDateRange) {
      FromDate = DateOrDateRange[0];
      ToDate = DateOrDateRange[1];
    }

    // console.log(fields['Financial_Year']);

    const formData = new FormData();
    formData.append("active_tab", this.active_tab);
    formData.append("Financial_Year", JSON.stringify(fields["Financial_Year"]));
    formData.append("Vertical_Id", JSON.stringify(fields["Vertical_Id"]));
    formData.append("Region_Id", JSON.stringify(fields["Region_Id"]));
    formData.append("Emp_Id", JSON.stringify(fields["Emp_Id"]));
    formData.append("Report_Type", JSON.stringify(fields["Report_Type"]));
    formData.append("Agent_Id", JSON.stringify(fields["Agent_Id"]));
    formData.append("Company_Id", JSON.stringify(fields["Company_Id"]));
    formData.append("SR_Source_Type", JSON.stringify(fields["SR_Source_Type"]));
    formData.append("SR_Type", JSON.stringify(fields["SR_Type"]));
    formData.append("Renewal_Status", JSON.stringify(fields["Status"]));
    formData.append("Month_Name", JSON.stringify(fields["Month_Name"]));
    formData.append("GlobalSearch", fields["GlobalSearch"]);
    formData.append("From_Date", this.api.StandrdToDDMMYYY(FromDate));
    formData.append("To_Date", this.api.StandrdToDDMMYYY(ToDate));

    if (this.pageNo == 1) {
      this.api.IsLoading();
    }

    this.api
      .HttpPostTypeBms(
        "../v2/sr/health/HealthInstallmentReport/Installment_Datatable?User_Id=" +
          this.api.GetUserId() +
          "&urlSegment=" +
          this.urlSegment +
          "&User_Code=" +
          this.api.GetUserData("Code") +
          "&Portal=CRM&Page=" +
          this.pageNo,
        formData
      )
      .then(
        (result) => {
          this.api.HideLoading();
          this.re_hit = "yes";
          this.show_spinner = "no";

          if (result["Status"] == true) {
            this.SQL_Where_STR = result["SQL_Where"];
            this.SqlWhere = result["SQL_Where1"];
            this.dataAr = result["data"];
            if (this.pageNo <= 1) {
              this.totalRecordsfiltered = result["recordsFiltered"];
              this.TotalRow = result["recordsFiltered"];
            }
            this.responseData = result["data"];
            this.post = this.post.concat(this.responseData);
            this.pageNo++;
            var keyss = 0;
            this.post = this.post.map((item) => {
              keyss++;
              item.SrNo = keyss;
              return item;
            });
          } else if (this.pageNo == 1 && result["Status"] == false) {
          }
          if (result["Status"] == false) {
            this.show_spinner = "no";
          }
        },
        (err) => {
          this.api.Toast(
            "Warning",
            "Network Error : " + err.name + "(" + err.statusText + ")"
          );
        }
      );
  }

  //===== VIEW DOCUMENTS =====//
  ViewDocument(url: any) {
    window.open(url, "", "left=100,top=50,width=800%,height=600");
  }

  //===== SR POPUP =====//
  SrPopup(type: any, row_Id: any): void {
    const formData = new FormData();
    formData.append("User_Id", this.api.GetUserData("Code"));
    formData.append("Source", "CRM");

    this.api
      .HttpPostTypeBms("../v2/sr/life/LifeSubmit/GetUserId", formData)
      .then(
        (result) => {
          if (result["Status"] == true) {
            var baseurl = "https://crm.squareinsurance.in/";

            var url =
              baseurl +
              "business-login/form/general-insurance/" +
              type +
              "/crm/" +
              result["User_Id"] +
              "/" +
              row_Id +
              "/web";
            window.open(url, "", "fullscreen=yes");
          } else {
            this.api.Toast("Error", result["Message"]);
          }
        },

        (err) => {
          this.api.Toast(
            "Warning",
            "Network Error, Please try again! " + err.message
          );
        }
      );
  }

  //===== UPDATE SR RENEWAL DETAILS MODAL =====//
  UpdateRenewalAction(row_Id: any, Track_Id: any, index: any): void {
    const dialogRef = this.dialog.open(HealthRenewalActionComponent, {
      width: "35%",
      height: "60%",
      data: { Id: row_Id, Track_Id: Track_Id },
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.GetSingleRenewalDetails(Track_Id, index);
    });
  }

  //===== VIEW RENEWAL TRACK MODAL =====//
  ViewRenewalTrack(row_Id: any, ShowAction: any): void {
    const dialogRef = this.dialog.open(HealthRenewalsTrackComponent, {
      width: "65%",
      height: "75%",
      data: { Id: row_Id, ShowAction: ShowAction },
    });

    dialogRef.afterClosed().subscribe((result) => {
      //this.Reload();
    });
  }

  //===== GET SINGLE RENEWAL DETAILS =====//
  GetSingleRenewalDetails(track_id: any, index: any) {
    const formData = new FormData();
    formData.append("track_id", track_id);

    this.api.IsLoading();
    this.api
      .HttpPostTypeBms(
        "../v2/sr/health/HealthInstallmentReport/GetSingleRenewalDetails",
        formData
      )
      .then(
        (result) => {
          this.api.HideLoading();
          if (result["Status"] == true) {
            this.post[index]["Renewal_Date"] = result["Renewal_Date"];
            this.post[index]["Renewal_Status"] = result["Renewal_Status"];
            this.post[index]["ShowAction"] = result["ShowAction"];
          }
        },
        (err) => {
          this.api.HideLoading();
        }
      );
  }

  //===== GET MONTH RENEWAL =====//
  FilterDataGetMonthRenewal() {
    const formData = new FormData();

    formData.append("User_Id", this.api.GetUserData("Id"));
    formData.append("User_Code", this.api.GetUserData("Code"));

    this.api.HttpForSR("post", "RenewalsReport/GetMonthRenewal", formData).then(
      (result) => {
        if (result["Status"] == true) {
          this.MonthRenewal = result["Data"];
        } else {
          this.api.Toast("Warning", result["Message"]);
        }
      },

      (err) => {
        this.api.Toast(
          "Warning",
          "Network Error : " + err.name + "(" + err.statusText + ")"
        );
      }
    );
  }

  //===== ENABLE / DISABLE MONTH FILTER =====//
  EnableDisableMonthFilter(Type: any) {
    //== Renewal Status ==//
    if (Type == "Status") {
      this.SearchForm.get("DateOrDateRange").setValue("");
      var Renewal_Status = this.SearchForm.value["Status"];

      //Dues Condition
      if (
        Renewal_Status &&
        Renewal_Status.length == 1 &&
        Renewal_Status[0]["Id"] == "Due"
      ) {
        this.SelectedCurrentMonth = [
          { Id: this.CurrentMonth, Name: this.Name },
        ];

        this.SearchForm.get("Month_Name").setValidators([Validators.required]);
        this.SearchForm.get("Month_Name").updateValueAndValidity();

        this.SearchForm.get("DateOrDateRange").setValidators(null);
        this.SearchForm.get("DateOrDateRange").updateValueAndValidity();
        this.SearchForm.get("DateOrDateRange").setValue("");

        //Grace Condition
      } else if (
        Renewal_Status &&
        Renewal_Status.length == 1 &&
        Renewal_Status[0]["Id"] == "Grace"
      ) {
        var date = new Date();
        var yesterday = new Date(date.getTime());
        yesterday.setDate(date.getDate() - 1);

        var EndD = yesterday;
        let day2 = EndD.getDate();
        let month2 = EndD.getMonth();
        let year2 = EndD.getFullYear();

        let format2 = month2 + "/" + day2 + "/" + year2;

        var StartD = yesterday;
        StartD.setMonth(StartD.getMonth() - 1);
        StartD.toLocaleDateString();

        this.dateRange = [StartD, EndD];

        let day1 = StartD.getDate();
        let month1 = StartD.getMonth();
        let year1 = StartD.getFullYear();

        let format1 = month1 + "/" + day1 + "/" + year1;

        this.SearchForm.get("DateOrDateRange").setValue(
          format1 + "-" + format2
        );

        this.SelectedCurrentMonth = [];
        this.SearchForm.get("Month_Name").setValidators(null);
        this.SearchForm.get("Month_Name").setValue("");
        this.SearchForm.get("Month_Name").updateValueAndValidity();

        this.SearchForm.get("DateOrDateRange").setValidators([
          Validators.required,
        ]);
        this.SearchForm.get("DateOrDateRange").updateValueAndValidity();

        //Others
      } else {
        this.SelectedCurrentMonth = [];

        this.SearchForm.get("Month_Name").setValidators(null);
        this.SearchForm.get("Month_Name").setValue("");
        this.SearchForm.get("Month_Name").updateValueAndValidity();

        this.SearchForm.get("DateOrDateRange").setValidators([
          Validators.required,
        ]);
        this.SearchForm.get("DateOrDateRange").updateValueAndValidity();
      }
    }
  }

  //===== UPDATE DATE RANGE =====//
  CheckDateLimit(item: any) {
    var Years = item.Id;
    var Explods = Years.split("-");
    var Year1 = parseInt(Explods[0]);
    var Year2 = Year1 + 1;

    this.minDate = new Date("04-01-" + Year1);
    this.maxDate = new Date("03-31-" + Year2);

    this.SearchForm.get("DateOrDateRange").setValue("");
  }

  //===== SEARCH COMPONENTS DATA =====//
  SearchComponentsData() {
    this.Emps_Ar = [];
    this.Employee_Placeholder = "Select Employee";
    this.SearchForm.get("Emp_Id").setValue("");
    this.SearchForm.get("Vertical_Id").setValue("");

    const formData = new FormData();
    formData.append("Portal", "CRM");
    formData.append("PageName", "health-installment-report");
    formData.append("User_Code", this.api.GetUserData("Code"));

    this.api.IsLoading();
    this.api
      .HttpPostTypeBms("common/FilterData/SearchComponentsData", formData)
      .then(
        (result) => {
          this.api.HideLoading();
          if (result["Status"] == true) {
            //this.BusinessLine_Ar = result['Data']['Business_Line_Ar'];
            this.Year_Ar = result["Data"]["YearsArray"];
            this.SelectedYear = result["Data"]["CurrentYear"];
            this.Vertical_Ar = result["Data"]["Vertical"];
            this.Region_Ar = result["Data"]["Region_Ar"];
            this.Companies_Ar = result["Data"]["LifeInsCompanyArray"];
            this.SRSource_Ar = result["Data"]["SrSourceArray"];
            this.SRType_Ar = result["Data"]["SrTypeArray"];
            this.RenewalPeriod_Ar = result["Data"]["RenewalPeriodArray"];
            this.Status_Ar = result["Data"]["RenewalStatusArray"];
            this.Months_Ar = result["Data"]["RenewalMonthsArray"];

            var Values1 = this.SelectedYear[0].Id;
            var Year1 = parseInt(Values1);
            var Year2 = Year1 + 1;

            this.minDate = new Date("04-01-" + Year1);
            this.maxDate = new Date("03-31-" + Year2);

            this.Get();
          }
        },
        (err) => {
          this.api.HideLoading();
        }
      );
  }

  //===== GET VERTICAL DATA =====//
  GetVerticalData() {
    this.Emps_Ar = [];
    this.Employee_Placeholder = "Select Employee";
    this.SearchForm.get("Emp_Id").setValue("");

    const formData = new FormData();
    formData.append("Portal", "CRM");
    formData.append("PageName", this.urlSegment);
    formData.append("User_Code", this.api.GetUserData("Code"));
    formData.append(
      "Business_Line_Id",
      JSON.stringify(this.SearchForm.value["Business_Line_Id"])
    );

    this.api
      .HttpPostTypeBms("common/FilterData/GetVerticalData", formData)
      .then(
        (result) => {
          if (result["Status"] == true) {
            this.Vertical_Ar = result["Data"];
          } else {
            this.api.Toast("Warning", result["Message"]);
            this.SearchForm.get("Vertical_Id").setValue("");
          }
        },
        (err) => {
          this.api.Toast(
            "Warning",
            "Network Error : " + err.name + "(" + err.statusText + ")"
          );
        }
      );
  }

  //===== GET EMPLOYEES DATA =====//
  GetEmployees() {
    this.Emps_Ar = [];
    this.Agents_Ar = [];
    this.SearchForm.get("Emp_Id").setValue("");
    this.SearchForm.get("Agent_Id").setValue("");
    this.SelectedReportType = [{ Id: "Team", Name: "Team" }];
    this.ReportTypeDisable = false;

    const formData = new FormData();
    formData.append("Portal", "CRM");
    formData.append("PageName", this.urlSegment);
    formData.append("User_Code", this.api.GetUserData("Code"));
    formData.append(
      "Vertical_Id",
      JSON.stringify(this.SearchForm.value["Vertical_Id"])
    );
    formData.append(
      "Region_Id",
      JSON.stringify(this.SearchForm.value["Region_Id"])
    );

    this.api.HttpPostTypeBms("common/FilterData/GetEmployees", formData).then(
      (result) => {
        if (result["Status"] == true) {
          this.Emps_Ar = result["Data"];
          this.Employee_Placeholder =
            "Select Employee (" + this.Emps_Ar.length + ")";
          this.Agents_Placeholder = "Select Agent";
        } else {
          this.api.Toast("Warning", result["Message"]);
          this.SearchForm.get("Emp_Id").setValue("");
          this.Emps_Ar = [];
        }
      },
      (err) => {
        this.api.Toast(
          "Warning",
          "Network Error : " + err.name + "(" + err.statusText + ")"
        );
      }
    );
  }

  //SET REPORT TYPE
  SetReportType() {
    this.GetAgents("0");
  }

  //===== GET AGENTS DATA =====//
  GetAgents(e: any) {
    this.Agents_Placeholder = "Select Agents";
    this.Agents_Ar = [];

    const formData = new FormData();

    if (this.SearchForm.get("Emp_Id").value.length > 1) {
      this.ReportTypeDisable = true;
      if (e == 1) {
        this.SelectedReportType = [{ Id: "Team", Name: "Team" }];
      }
    } else {
      this.ReportTypeDisable = false;
    }

    formData.append("User_Code", this.api.GetUserData("Code"));
    formData.append("Portal", "CRM");
    formData.append("PageName", this.urlSegment);
    formData.append("Agent_Type", "");
    formData.append(
      "Report_Type",
      JSON.stringify(this.SearchForm.value["Report_Type"])
    );
    formData.append("RM_Ids", JSON.stringify(this.SearchForm.value["Emp_Id"]));

    this.api.HttpPostTypeBms("common/FilterData/GetAgents", formData).then(
      (result) => {
        if (result["Status"] == true) {
          this.Agents_Ar = result["Data"];
          this.Agents_Placeholder =
            "Select Agents (" + this.Agents_Ar.length + ")";
        } else {
          this.Agents_Ar = [];
          this.api.Toast("Warning", result["Message"]);
        }
      },
      (err) => {
        this.api.Toast(
          "Warning",
          "Network Error : " + err.name + "(" + err.statusText + ")"
        );
      }
    );
  }
}
