import { Component, inject,signal, OnDestroy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Track } from '../../shared/models/track.model';
import { TrackService } from '../../shared/services/track.service';
import { DatePipe } from '@angular/common';

const ALLOWED_TYPES= ['audio/mpeg','audio/wav','audio/x-wav','audio/ogg','audio/mp4','audio/x-m4a']; 
const MAX_FILE_SIZE= 25* 1024* 1024;

@Component({
  imports: [ReactiveFormsModule,DatePipe],
  templateUrl: './tracks-page.html',
  styleUrl: './tracks-page.css',
})
export class TracksPageComponent implements OnDestroy {
  private readonly service = inject(TrackService);

  readonly tracks = signal<Track[]>([]);
  readonly page = signal(1);
  readonly pages = signal(1);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null); //mess d'erreur pour l'utilisateur
  readonly uploadError = signal<string | null>(null); // mess d'erreur de l'upload
  readonly uploading = signal(false);
  readonly uploadSuccess = signal<string | null>(null); //mess de succès
  readonly audioUrl = signal('');
  readonly currentTrack = signal<Track | null>(null); //morceau en cours 
  readonly audioLoading = signal(false); //il est true pendant le telechargement du fichier 
  readonly audioError = signal<string | null>(null); //erreur de lecture
  readonly title = new FormControl('', { nonNullable: true });
  file?: File;

  constructor() {
    this.load();
  }

  choose(event: Event): void {

    const input= event.target as HTMLInputElement;  
    const file = input.files?.[0];    

    this.uploadError.set(null);//on efface les anciens messages
    this.uploadSuccess.set(null);                    

    const problem = file ? this.validate(file) : null;//on vérifie la validité du fichier avec la méthode
    if (problem) {  

      this.uploadError.set(problem);//on affiche le probleme
      this.file = undefined;                            
      input.value = ''; //on met le champ à vide
                                     
      return;     
    }

    this.file =file;
    console.debug('[TracksPage] Fichier sélectionné', this.file?.name);

  }

  /* méthode validate utilisée pour renvoyer un mess si le fichier est invalide (sinon null)*/
  private validate(file: File): string | null{

    if (!ALLOWED_TYPES.includes(file.type)){

      return 'Format non accepté : choisissez un fichier MP3, WAV, OGG ou M4A.';
    }

    if (file.size > MAX_FILE_SIZE) {

      const sizeMo = (file.size / 1024 / 1024).toFixed(1);//conversion des octets en Mo
      return `Fichier trop volumineux (${sizeMo} Mo). Maximum : 25 Mo.`;

    }

    return null;//si tout est bon
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null); // on efface l'erreur et on retente une requete

    this.service.list(this.page()).subscribe({
      next: (response) => {
        console.debug('[TracksPage] Pistes chargées', response.items.length);
        this.tracks.set(response.items);
        this.pages.set(response.pages);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('[TracksPage] Chargement impossible', error);

        //afficher mess d'erreur initial sinon mess d'erreur écrit
        this.error.set(error.error?.message ?? 'Impossible de charger vos pistes. Réessayez');
        this.loading.set(false); //on garde l'arret de chargement 
      },
    });
  }

  go(page: number): void {
    this.page.set(page);
    this.load();
  }

  upload(fileInput: HTMLInputElement): void {

    if (!this.file || this.uploading()) return; //on rajoute un check sur un envoi en cours

    const problem = this.validate(this.file); //dernier check avant l'appel HTTP
    
    if (problem) {                               
      this.uploadError.set(problem);  

      return;                                    
    }                                            

    this.uploading.set(true);// dans l'état de chargement: bouton desactive       
    this.uploadError.set(null);    
    this.uploadSuccess.set(null);  

    this.service.upload(this.file, this.title.value || this.file.name).subscribe({

      next: (track) => {

        console.debug('[TracksPage] Piste envoyée', track.id);
        this.uploading.set(false);
        this.uploadSuccess.set(`« ${track.title} » a bien été ajoutée.`);
        this.title.setValue('');
        this.file = undefined;
        fileInput.value = '';
        this.page.set(1);
        this.load();

      },

      error: (error) => {

      console.error('[TracksPage] Envoi impossible', error);

      this.uploading.set(false);
      
      if (error.status === 0) {                                                      
        this.uploadError.set('Le serveur est injoignable. Vérifiez votre connexion et réessayez.'); 
      } 
      
      else {                 
        this.uploadError.set(error.error?.message ?? "L'envoi a échoué. Réessayez.");
      }   
      }
      
    });
  }

  play(track: Track): void {

    this.audioError.set(null);  //ancienne erreur supp
    this.audioLoading.set(true); //morceau qui charge
    this.service.audio(track.id).subscribe({

      next: (blob) => {

        console.debug('[TracksPage] Audio chargé', track.id);
        const previousUrl = this.audioUrl();
        if (previousUrl) URL.revokeObjectURL(previousUrl);
        this.audioUrl.set(URL.createObjectURL(blob));

        this.currentTrack.set(track); //on retient le morceau en cours
        this.audioLoading.set(false);

      },

      error: (error) => { //on va plutot afficher un reel mess d'erreur

        console.error('[TracksPage] Lecture impossible', error);
        this.audioLoading.set(false);

        if (error.status === 0) { //si le serveur repond pas
          this.audioError.set('Le serveur est injoignable. Réessayez plus tard.');
        } 
        
        else if (error.status === 404) {
          this.audioError.set('Ce morceau est introuvable.');
        } 
        
        else { 
          this.audioError.set('Impossible de lire ce morceau. Réessayez.');
        }

      }, 
    });
  }

    onAudioError(): void {
      this.audioError.set("Le navigateur n'arrive pas à lire ce fichier audio.");
  }

  //on convertit la taille en Mo (plus lisible)
  formatSize(bytes: number): string {
    return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
  }

formatType(mimeType: string): string {
  const formats: Record<string, string> = {
    'audio/mpeg': 'MP3',
    'audio/wav': 'WAV',
    'audio/x-wav': 'WAV',
    'audio/ogg': 'OGG',
    'audio/mp4': 'M4A',
    'audio/x-m4a': 'M4A',
  };
  return formats[mimeType] ?? mimeType;  // si le type est inconnu, on l'affiche tel quel
}

  ngOnDestroy(): void { //appelée par angular pour liberer le objectURL
    const url = this.audioUrl();
    if (url) URL.revokeObjectURL(url);
    console.debug('[TracksPage] ObjectURL révoquée', url);
  }
  

}