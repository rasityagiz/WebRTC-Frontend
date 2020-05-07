import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { AppComponent } from "./app.component";
import { EnterPageComponent } from "./components/enter_page/enter_page.component";
import { MainPageComponent } from "./components/main_page/main_page.component";

const routes: Routes = [{
    path: '',
    component: AppComponent,
    children: [
        {
            path: '',
            component: EnterPageComponent
        },
        {
            path: 'main',
            component: MainPageComponent
        }
    ]
}];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {}