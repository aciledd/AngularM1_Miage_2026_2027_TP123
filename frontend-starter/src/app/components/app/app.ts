import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

//composant racine: affiche le header (avec état de connexion) et la page active grace à router-outlet

@Component({

  selector: 'app-root',
  imports: [RouterLink, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
  
})

export class AppComponent implements OnInit {

  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  //au démarrage de l'app si un token existe déjà (localStorage) mais que currentUser
  //n'est pas encore chargé (ex: après un F5) on recharge le profil pour l'afficher.
  
  ngOnInit(): void {

    if (this.auth.token() && !this.auth.currentUser()) {
      this.auth.profile().subscribe({ error: () => this.auth.logout() });
    }

  }

  logout(): void {

    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }

}