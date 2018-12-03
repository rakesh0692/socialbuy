import { of as observableOf, Observable, throwError, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { AppState } from '../../interfaces';
import { Store } from '@ngrx/store';
import { AuthActions } from '../../auth/actions/auth.actions';
import { AuthService as OauthService } from 'ng2-ui-auth';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { HttpRequest } from '@angular/common/http/src/request';
import { ToastrService, ActiveToast } from 'ngx-toastr';
import { isPlatformBrowser } from '@angular/common';
import { User } from '../models/user';
import { RatingCategory } from '../models/rating_category';


@Injectable()
export class AuthService {
  api = "http://engine.artistarohit.com"
  /**
   * Creates an instance of AuthService.
   * @param {HttpService} http
   * @param {AuthActions} actions
   * @param {Store<AppState>} store
   *
   * @memberof AuthService
   */
  constructor(
    private http: HttpClient,
    private actions: AuthActions,
    private store: Store<AppState>,
    private oAuthService: OauthService,
    private toastrService: ToastrService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: any
  ) { }

  /**
   *
   *
   * @param {Authenticate} { email, password }
   * @returns {Observable<User>}
   * @memberof AuthService
   */

  login({ email, password }): Observable<User> {
    const params = { data: { attributes: { 'email': email, 'password': password } } };
    return this.http.post<User>(this.api +'api/login', params).pipe(
      map(user => {
        this.setTokenInLocalStorage(user, 'user');
        this.store.dispatch(this.actions.getCurrentUserSuccess(JSON.parse(localStorage.getItem('user'))));
        this.store.dispatch(this.actions.loginSuccess())
        return user;
      }),
      tap(
        _ => this.router.navigate(['/']),
        error => this.toastrService.error(error.error.errors.detail, 'ERROR!')
      ),
      catchError(error => {
        return observableOf(error);
      })
    );
  }

  /**
   *
   *
   * @param {User} data
   * @returns {Observable<User>}
   *
   * @memberof AuthService
   */
  register(user : User){
    const body: User = {
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      password: user.password
    }
    return this.http.post(this.api + 'register', body);
  }

  /**
   *
   *
   * @param {anyUser} data
   * @returns {Observable<any>}
   * @memberof AuthService
   */
  forgetPassword(data: User): Observable<any> {
    return this.http.post('auth/passwords', { spree_user: data }).pipe(
      map(_ =>
        this.toastrService.success(
          'Password reset link has be sent to your email.',
          'Success'
        )
      ),
      tap(
        _ => _,
        _ => this.toastrService.error('Not a valid email/user', 'ERROR!!')
      )
    );
  }

  /**
   *
   *
   * @param {User} data
   * @returns {Observable<any>}
   * @memberof AuthService
   */
  // updatePassword(data: User): Observable<void | ActiveToast<any>> {
  //   return this.http
  //     .put(`auth/passwords/${data.id}`, { spree_user: data })
  //     .pipe(
  //       map(_ =>
  //         this.toastrService.success(
  //           'Password updated success fully!',
  //           'Success'
  //         )
  //       ),
  //       tap(
  //         _ => _,
  //         _ => this.toastrService.error('Unable to update password', 'ERROR!')
  //       )
  //     );
  // }

  /**
   *
   *
   * @returns {Observable<any>}
   *
   * @memberof AuthService
   */
  authorized(): Observable<any> {
    return this.http
      .get('api/v1/authenticated')
      .pipe(catchError(error => of(error.error)));
  }

  /**
   *
   *
   * @returns
   *
   * @memberof AuthService
   */
  logout() {
    return this.http.post('api/v1/logout', {}).pipe(
      map((res: Response) => {
        if (isPlatformBrowser(this.platformId)) {
          localStorage.clear();
        }
        this.store.dispatch(this.actions.logoutSuccess());
        return res;
      })
    );
  }

  /**
   *
   *
   * @returns {{}}
   * @memberof AuthService
   */
  // getTokenHeader(request: HttpRequest<any>): HttpHeaders {
  //   if (this.getUserToken()) {
  //     return new HttpHeaders({
  //       'Content-Type': 'application/vnd.api+json',
  //       'Authorization': `Bearer ${this.getUserToken()}`,
  //       'Accept': '*/*'
  //     });
  //   } else {
  //     return new HttpHeaders({
  //       'Content-Type': 'application/vnd.api+json',
  //       'Accept': '*/*'
  //     });
  //   }

  // }

  /**
   *
   *
   * @private
   * @param {any} user_data
   *
   * @memberof AuthService
   */
  private setTokenInLocalStorage(user_data: any, keyName: string): void {
    const jsonData = JSON.stringify(user_data);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(keyName, jsonData);
    }
  }

  /**
   *
   *
   * @param {string} provider
   * @returns
   * @memberof AuthService
   */
  socialLogin(provider: string) {
    return this.oAuthService.authenticate<User>(provider).pipe(
      map(user => {
        this.setTokenInLocalStorage(user, 'user');
        return user;
      }),
      catchError(_ => {
        this.toastrService.error('Social login failed', 'ERROR!');
        return observableOf('Social login failed');
      })
    );
  }

  // getUserToken() {
  //   if (isPlatformBrowser(this.platformId)) {
  //     const user: User = JSON.parse(localStorage.getItem('user'))
  //     return user ? user.token : null
  //   } else {
  //     return null;
  //   }
  // }

  getRatingCategories(): Observable<Array<RatingCategory>> {
    return this.http.get<Array<RatingCategory>>(`api/v1/ratings/`);
  }
}
