import { Directive, HostListener, ElementRef, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { NgControl } from '@angular/forms';
import { apenasDigitos, formatarCnpj, formatarCpf } from '../../core/utils/cpf.util';
import { TipoPessoa } from '../../core/models/pessoa.model';

@Directive({
  selector: '[appCpfMask]',
  standalone: true,
})
export class CpfMaskDirective implements OnChanges {
  /** 'fisica' força CPF, 'juridica' força CNPJ, 'auto' detecta pela quantidade de dígitos digitados. */
  @Input('appCpfMask') tipo: TipoPessoa | 'auto' = 'auto';

  private readonly elementRef = inject(ElementRef<HTMLInputElement>);
  private readonly ngControl = inject(NgControl, { self: true, optional: true });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tipo'] && !changes['tipo'].firstChange) {
      this.reformatar();
    }
  }

  @HostListener('input')
  onInput(): void {
    this.reformatar();
  }

  private reformatar(): void {
    const valorAtual = this.elementRef.nativeElement.value;
    const usaCnpj = this.tipo === 'juridica' || (this.tipo === 'auto' && apenasDigitos(valorAtual).length > 11);
    const valorFormatado = usaCnpj ? formatarCnpj(valorAtual) : formatarCpf(valorAtual);
    this.elementRef.nativeElement.value = valorFormatado;
    this.ngControl?.control?.setValue(valorFormatado, { emitEvent: false });
  }
}
